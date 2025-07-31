import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../services/dashboard.service';
import { RevenueTargetService } from '../services/revenue-target.service';
import { addDays, format, parseISO } from 'date-fns';
import { getISOWeek } from 'date-fns';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { UserService } from '../services/user.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: false
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  currentTimeFrame: 'hour'|'day'|'week'|'month'|'year' = 'day';
  timeFrames = ['hour', 'day', 'week', 'month', 'year'] as const;
  timeFrameLabels: Record<string, string> = {
    hour: 'Hourly',
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
    year: 'Yearly'
  };

  // Data variables
  topMetricsData: any[] = [];
  salesMetricsData: any[] = [];
  userMetricsData: any[] = [];
  segmentationData: any[] = [];
  salesTrendData: any[] = [];
  orderCount: number = 0;
  activeUserCount: number = 0;
  customersCount: number = 0;
  sessionCount: number = 0;
  bounceRate: number = 0;
  previousMetrics: any = {};
  revenueTarget: number = 0;
  onlineAdminCount: number = 0;
  users: any[] = [];
  engagementAnalytics: any = {};
  engagementTrends: any[] = [];
  customerSegmentation: any[] = [];
  customerAcquisitionData: any[] = [];

  // Sales Analytics Data
  brandSalesData: any[] = [];
  categorySalesData: any[] = [];
  productSalesData: any[] = [];
  deliveryServiceData: any[] = [];

  // fetchOnlineAdminCount(): void {
  //   this.adminUserService.getAdminUsersOnlineStatus().subscribe(statusMap => {
  //     this.onlineAdminCount = Object.values(statusMap).filter((s: any) => s.isOnline).length;
  //   });
  // }

  // Summary metrics
  totalCustomers = 0;
  engagementRate = 0;

  // Charts
  charts: { [key: string]: Chart } = {};
  updateInterval: any;

  showRevenue = true;
  showTarget = true;
  showRevenueDropdown = false;

  showSalesTrendDropdown = false;
  showSales = true;

  showUserGrowthDropdown = false;
  showActiveUsers = true;
  showNewUsers = true;

  showEngagementDropdown = false;
  showViews = true;
  showEngagement = true;

  showCustomerAcqDropdown = false;
  showAcquired = true;
  showChurned = true;
  showRetained = true;

  private stompClient: Client | null = null;
  private dashboardSub: StompSubscription | null = null;
  private wsConnected = false;

  // Chart instances
  salesChart: any;
  userGrowthChart: any;
  customerAcquisitionChart: any;
  customerDistributionChart: any;
  profileViewsChart: any;
  
  // Sales Analytics Chart instances
  brandSalesChart: any;
  categorySalesChart: any;
  productSalesChart: any;
  deliveryServiceChart: any;

  constructor(
    private dashboardService: DashboardService,
    private revenueTargetService: RevenueTargetService,
    private userService: UserService,
    // private adminUserService: AdminUserService,
  ) { }

  ngOnInit(): void {
    Chart.register(...registerables);
    this.setupWebSocket();
    this.userService.getCustomers().subscribe(users => {
      console.log('Fetched users:', users); // Log users for debugging
      this.users = users;
      this.refreshDashboard();
      this.updateUserMetrics();
    });
    this.updateInterval = setInterval(() => {
      if (!this.wsConnected) {
        this.refreshDashboard();
        this.updateUserMetrics();
      }
    }, 30000);
  }

  setupWebSocket(): void {
    this.stompClient = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        this.wsConnected = true;
        this.dashboardSub = this.stompClient!.subscribe('/topic/dashboard-metrics', (message: IMessage) => {
          const trend = JSON.parse(message.body);
          this.salesTrendData = trend.map((d: any) => ({ ...d, period: d.label }));
          // Optionally, update other metrics if needed
          this.updateDashboardFromWebSocket(trend);
          this.updateSalesTrendChart();
        });
      },
      onStompError: () => {
        this.wsConnected = false;
      },
      onWebSocketClose: () => {
        this.wsConnected = false;
      }
    });
    this.stompClient.activate();
  }

  updateDashboardFromWebSocket(trend: any[]): void {
    // You may want to update topMetricsData, orderCount, activeUserCount, customersCount, etc. from trend
    // For now, just update the trend chart
    // Optionally, you can parse and update other metrics here
  }

  refreshDashboard(): void {
    this.dashboardService.getTotalSales().subscribe(totalSales => {
      this.dashboardService.getSalesTrend(this.currentTimeFrame).subscribe(trend => {
        console.log('Sales Trend Data:', trend); // Log the trend data for debugging
        // Map backend 'label' to 'period' for chart compatibility
        this.salesTrendData = trend.map(d => ({ ...d, period: d.label }));
        this.dashboardService.getOrderCount().subscribe(orderCount => {
          this.orderCount = orderCount;
          this.dashboardService.getActiveUsers(this.currentTimeFrame).subscribe(activeUserCount => {
            this.activeUserCount = activeUserCount;
            this.dashboardService.getCustomersCount().subscribe(customersCount => {
              this.customersCount = customersCount;
              this.dashboardService.getPreviousMetrics(this.currentTimeFrame).subscribe(prev => {
                this.previousMetrics = prev;
                this.updateDashboard(totalSales, trend);
                this.updateSalesTrendChart();
                this.revenueTargetService.getTarget(this.currentTimeFrame, this.getCurrentPeriodValue()).subscribe(res => {
                  this.revenueTarget = res.targetAmount || 0;
                  this.updateRevenueTargetChart();
                  
                  // Fetch session and bounce rate data
                  this.dashboardService.getSessionStats(this.currentTimeFrame).subscribe({
                    next: (stats) => {
                      this.sessionCount = stats.totalSessions || 0;
                      this.bounceRate = stats.bounceRate || 0;
                      
                      // Fetch session trends for charts
                      this.dashboardService.getSessionTrends(this.currentTimeFrame).subscribe({
                        next: (trends) => {
                          this.updateUserMetricsWithTrends(trends);
                        },
                        error: (error) => {
                          console.error('Error fetching session trends:', error);
                          this.updateUserMetrics();
                        }
                      });
                    },
                    error: (error) => {
                      console.error('Error fetching session stats:', error);
                      this.updateUserMetrics();
                    }
                  });
                  
                  // Fetch engagement analytics and trends
                  this.dashboardService.getEngagementAnalytics(this.currentTimeFrame).subscribe({
                    next: (analytics) => {
                      this.engagementAnalytics = analytics;
                    },
                    error: (error) => {
                      console.error('Error fetching engagement analytics:', error);
                    }
                  });
                  
                  this.dashboardService.getEngagementTrends(this.currentTimeFrame).subscribe({
                    next: (trends) => {
                      this.engagementTrends = trends;
                      this.updateEngagementChart();
                    },
                    error: (error) => {
                      console.error('Error fetching engagement trends:', error);
                      this.updateEngagementChart();
                    }
                  });

                  // Fetch VIP tier data
                  this.dashboardService.getVipTierData(this.currentTimeFrame).subscribe({
                    next: (vipTierData: any[]) => {
                      console.log('VIP Tier Data received:', vipTierData);
                      this.customerSegmentation = vipTierData;
                      this.segmentationData = vipTierData; // Update the display data
                      this.totalCustomers = vipTierData.filter((tier: any) => tier.value > 0).reduce((sum: number, tier: any) => sum + tier.value, 0);
                      console.log('Total customers:', this.totalCustomers);
                      console.log('Segmentation data updated:', this.segmentationData);
                      this.updateCustomerAcqChart();
                    },
                    error: (error: any) => {
                      console.error('Error fetching VIP tier data:', error);
                      // Set default data on error
                      this.segmentationData = [
                        { name: 'Regular', color: '#374151', value: 0 },
                        { name: 'Silver', color: '#9CA3AF', value: 0 },
                        { name: 'Gold', color: '#F59E0B', value: 0 },
                        { name: 'Platinum', color: '#E5E7EB', value: 0 }
                      ];
                      this.totalCustomers = 0;
                      this.updateCustomerAcqChart();
                    }
                  });
                  
                  // Fetch customer acquisition data
                  this.dashboardService.getCustomerAcquisition(this.currentTimeFrame).subscribe({
                    next: (acquisition: any[]) => {
                      console.log('Customer acquisition data received:', acquisition);
                      this.customerAcquisitionData = acquisition;
                      this.updateCustomerAcqChart();
                    },
                    error: (error: any) => {
                      console.error('Error fetching customer acquisition:', error);
                    }
                  });

                  // Refresh sales analytics charts
                  this.createSalesAnalyticsCharts();
                });
              });
            });
          });
        });
      });
    });
    // this.fetchOnlineAdminCount();
  }

  // Replace nested subscriptions with forkJoin

  ngAfterViewInit(): void {
    // Create charts after view is initialized
    setTimeout(() => {
      this.createCustomerDistributionPieChart();
      this.createSalesAnalyticsCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.dashboardSub) {
      this.dashboardSub.unsubscribe();
    }
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
    Object.values(this.charts).forEach(chart => chart.destroy());
    
    // Destroy sales analytics charts
    if (this.brandSalesChart) {
      this.brandSalesChart.destroy();
    }
    if (this.categorySalesChart) {
      this.categorySalesChart.destroy();
    }
    if (this.productSalesChart) {
      this.productSalesChart.destroy();
    }
    if (this.deliveryServiceChart) {
      this.deliveryServiceChart.destroy();
    }
  }

  changeTimeFrame(frame: 'hour'|'day'|'week'|'month'|'year'): void {
    this.currentTimeFrame = frame;
    this.refreshDashboard();
    this.updateSalesTrendChart();
    this.updateUserMetrics();
    this.createSalesAnalyticsCharts();
  }

  updateDashboard(totalSales: number, trend: any[]): void {
    // Use real totalSales, orderCount, activeUserCount, customersCount, and trend for all metrics and chart data
    const prev = this.previousMetrics || {};
    const prevTotalSales = prev.totalSales || 0;
    const prevRevenue = prev.revenue || 0;
    const prevOrders = prev.orders || 0;
    const prevAvgOrder = prev.avgOrder || 0;
    const prevActiveUsers = prev.activeUsers || 0;
    const prevCustomers = prev.customers || 0;
    this.topMetricsData = [
      {
        id: 'total-sales',
        title: 'Total Sales',
        value: this.formatNumber(totalSales),
        currency: 'MMK',
        change: this.getPercentChange(totalSales, prevTotalSales),
        isPositive: totalSales >= prevTotalSales,
        chartData: trend.map(d => ({ value: d.total })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#10b981'
      },
      {
        id: 'revenue',
        title: 'Revenue',
        value: this.formatNumber(Math.floor(totalSales * 0.72)),
        currency: 'MMK',
        change: this.getPercentChange(totalSales * 0.72, prevRevenue),
        isPositive: (totalSales * 0.72) >= prevRevenue,
        chartData: trend.map(d => ({ value: d.total * 0.72 })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#3b82f6'
      },
      {
        id: 'active-users',
        title: 'Active Users',
        value: this.formatNumber(this.activeUserCount),
        change: this.getPercentChange(this.activeUserCount, prevActiveUsers),
        isPositive: this.activeUserCount >= prevActiveUsers,
        chartData: trend.map(d => ({ value: d.activeUserCount || 0 })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#8b5cf6'
      },
      {
        id: 'conversion',
        title: 'Conversion',
        value: this.activeUserCount > 0 ? (Math.round((this.orderCount / this.activeUserCount) * 100) + '%') : '0%',
        change: this.getPercentChange(
          this.activeUserCount > 0 ? (this.orderCount / this.activeUserCount) * 100 : 0,
          prevActiveUsers > 0 ? (prevOrders / prevActiveUsers) * 100 : 0
        ),
        isPositive: (this.activeUserCount > 0 ? (this.orderCount / this.activeUserCount) : 0) >= (prevActiveUsers > 0 ? (prevOrders / prevActiveUsers) : 0),
        chartData: trend.map(d => ({ value: d.activeUserCount > 0 ? (d.orderCount / d.activeUserCount) * 100 : 0 })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#ef4444'
      },
      {
        id: 'orders',
        title: 'Orders',
        value: this.formatNumber(this.orderCount),
        change: this.getPercentChange(this.orderCount, prevOrders),
        isPositive: this.orderCount >= prevOrders,
        chartData: trend.map(d => ({ value: d.orderCount })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#f59e0b'
      },
      {
        id: 'customers',
        title: 'Customers',
        value: this.formatNumber(this.customersCount),
        change: this.getPercentChange(this.customersCount, prevCustomers),
        isPositive: this.customersCount >= prevCustomers,
        chartData: trend.map(d => ({ value: d.customersCount || 0 })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#06b6d4'
      }
    ];
    // Show only 4 sales metric cards: Total Sales, Revenue, Orders, Avg Order
    this.salesMetricsData = [
      {
        id: 'total-sales',
        title: 'Total Sales',
        value: this.formatNumber(totalSales),
        currency: 'MMK',
        change: this.getPercentChange(totalSales, prevTotalSales),
        isPositive: totalSales >= prevTotalSales,
        chartData: trend.map(d => ({ value: d.total })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#10b981'
      },
      {
        id: 'revenue',
        title: 'Revenue',
        value: this.formatNumber(Math.floor(totalSales * 0.72)),
        currency: 'MMK',
        change: this.getPercentChange(totalSales * 0.72, prevRevenue),
        isPositive: (totalSales * 0.72) >= prevRevenue,
        chartData: trend.map(d => ({ value: d.total * 0.72 })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#3b82f6'
      },
      {
        id: 'orders',
        title: 'Orders',
        value: this.formatNumber(this.orderCount),
        change: this.getPercentChange(this.orderCount, prevOrders),
        isPositive: this.orderCount >= prevOrders,
        chartData: trend.map(d => ({ value: d.orderCount })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#f59e0b'
      },
      {
        id: 'avg-order',
        title: 'Avg Order',
        value: this.orderCount > 0 ? this.formatNumber(Math.floor(totalSales / this.orderCount)) : '0',
        currency: 'MMK',
        change: this.getPercentChange(this.orderCount > 0 ? Math.floor(totalSales / this.orderCount) : 0, prevAvgOrder),
        isPositive: (this.orderCount > 0 ? Math.floor(totalSales / this.orderCount) : 0) >= prevAvgOrder,
        chartData: trend.map(d => ({ value: d.orderCount > 0 ? Math.floor(d.total / d.orderCount) : 0 })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#ef4444'
      }
    ];
    // Re-create charts with the new data
    setTimeout(() => {
      this.createTopMetricsCharts();
      this.createSalesCharts(this.salesMetricsData, totalSales);
    }, 100);
  }

  private createTopMetricsCharts(): void {
    this.topMetricsData.forEach((metric, index) => {
      setTimeout(() => {
        this.createMiniChart('chart-' + metric.id, metric.chartData, metric.chartColor, 'line', metric.chartLabels);
      }, index * 100);
    });
  }

  private createSalesCharts(salesData: any[], avgSales: number): void {
    this.salesMetricsData.forEach((metric, index) => {
      setTimeout(() => {
        this.createMiniChart('chart-sm-' + metric.id, metric.chartData, metric.chartColor, 'area');
        this.createMiniChart('chart-sm-line-' + metric.id, metric.chartData, metric.chartColor, 'line');
      }, index * 150);
    });

    setTimeout(() => {
      this.updateSalesTrendChart();

      this.updateRevenueTargetChart();
    }, 300);
  }

  private createUserCharts(userData: any[]): void {
    this.userMetricsData.forEach((metric, index) => {
      setTimeout(() => {
        this.createMiniChart('chart-user-' + metric.id, metric.chartData, metric.chartColor, 'area');
        this.createMiniChart('chart-user-line-' + metric.id, metric.chartData, metric.chartColor, 'line');
      }, index * 150);
    });

    setTimeout(() => {
      this.updateUserGrowthChart();
      this.updateEngagementChart();
    }, 400);
  }

  private createCustomerCharts(): void {
    setTimeout(() => {
      this.updateCustomerAcqChart();
    }, 500);
  }

  private createSalesAnalyticsCharts(): void {
    console.log('🎯 createSalesAnalyticsCharts() called');
    console.log('📊 Current timeFrame:', this.currentTimeFrame);
    
    // Load dynamic data from API
    this.loadBrandSalesData();
    this.loadCategorySalesData();
    this.loadProductSalesData();
    this.loadDeliveryServiceData();
  }

  private createMiniChart(canvasId: string, data: any[], color: string, type = 'line', labels?: string[]): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    // Create a vertical gradient for the area fill
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, color + '80'); // More opaque at the top
    gradient.addColorStop(1, color + '10'); // More transparent at the bottom
    // Ensure labels are string[]
    const chartLabels = (labels || data.map((_, i) => i)).map(l => l.toString());
    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          data: data.map(d => d.value),
          borderColor: color,
          backgroundColor: gradient,
          fill: true,
          tension: 0.5, // Smooth curve
          pointRadius: 0,
          borderWidth: 2,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { borderJoinStyle: 'round' } },
        animation: false,
        responsive: false,
        maintainAspectRatio: false
      }
    });
  }

  private createEnhancedChart(canvasId: string, data: any[], dataKeys: string[], colors: string[], type = 'line'): void {
    console.log('createEnhancedChart called with:', { canvasId, data, dataKeys, colors, type });
    
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.error(`Canvas element ${canvasId} not found`);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error(`Could not get 2D context for ${canvasId}`);
      return;
    }
    
    // Destroy existing chart if it exists
    if (this.charts[canvasId]) {
      console.log(`Destroying existing chart for ${canvasId}`);
      this.charts[canvasId].destroy();
    }
    
    const datasets = dataKeys.map((key, index) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, colors[index] + '40');
      gradient.addColorStop(1, colors[index] + '05');
      
      const dataValues = data.map((d: any) => {
        const value = d[key];
        console.log(`Data point for ${key}:`, value, typeof value);
        return value;
      });
      
      const dataset = {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        data: dataValues,
        borderColor: colors[index],
        backgroundColor: type === 'area' ? gradient : 'transparent',
        borderWidth: 3, // Increased back to 3 for better visibility
        fill: type === 'area',
        tension: 0.4,
        pointRadius: 0, // Hide points for smooth lines
        pointHoverRadius: 6, // Only show points on hover
        pointBackgroundColor: colors[index], // Changed to match border color
        pointBorderWidth: 2,
        pointBorderColor: '#ffffff',
        pointStyle: 'circle',
        // Ensure lines are visible
        borderDash: [],
        borderDashOffset: 0,
      };
      
      console.log(`Created dataset for ${key}:`, dataset);
      console.log(`Data values for ${key}:`, dataValues);
      return dataset;
    });
    
    console.log('Final datasets:', datasets);
    console.log('Labels:', data.map((d: any) => d.period));
    console.log('Data length:', data.length);
    
    // Check if we have enough data points for lines
    if (data.length < 2) {
      console.warn('Not enough data points for line chart. Need at least 2 points.');
    }
    
    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((d: any) => d.period),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true, // Changed from false to true to show legend
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 12, weight: 'bold' }
            }
          },
          tooltip: {
            usePointStyle: true,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#374151',
            bodyColor: '#374151',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            titleFont: { size: 14, weight: 600 },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context: any) => {
                return `${context.dataset.label}: ${this.formatNumber(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true, // Changed from false to true to show grid
              color: '#f1f5f9',
              drawTicks: true
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 11, weight: 'bold' },
              maxTicksLimit: 8
            }
          },
          y: {
            grid: {
              color: '#f1f5f9',
              drawTicks: true
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 11, weight: 'bold' },
              callback: (value: any) => {
                return this.formatNumber(value);
              },
              maxTicksLimit: 6
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart'
        }
      }
    });
    
    console.log(`Chart created for ${canvasId}:`, this.charts[canvasId]);
    
    // Force chart update
    setTimeout(() => {
      if (this.charts[canvasId]) {
        this.charts[canvasId].update();
        console.log(`Chart updated for ${canvasId}`);
      }
    }, 100);
  }

  private generateSalesData(timeFrame: string): any[] {
    const data = [];
    const now = new Date();

    switch (timeFrame) {
      case 'hour':
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
          const hourStr = hour.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          const hourOfDay = hour.getHours();
          const baseMultiplier = this.getHourlyMultiplier(hourOfDay);
          data.push({
            period: hourStr,
            sales: Math.floor((Math.random() * 3000 + 1500) * baseMultiplier),
          });
        }
        break;
      case 'day':
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const multiplier = isWeekend ? 1.4 : 1.0;
          const trend = 1 + (29 - i) * 0.02;
          data.push({
            period: dateStr,
            sales: Math.floor((Math.random() * 25000 + 35000) * multiplier * trend),
          });
        }
        break;
      case 'week':
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        weekDays.forEach((day, index) => {
          const isWeekend = index >= 5;
          const multiplier = isWeekend ? 1.5 : 1.0;
          data.push({
            period: day,
            sales: Math.floor((Math.random() * 40000 + 60000) * multiplier),
          });
        });
        break;
      case 'month':
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const trend = 1 + (29 - i) * 0.015;
          data.push({
            period: dateStr,
            sales: Math.floor((Math.random() * 50000 + 70000) * trend),
          });
        }
        break;
      case 'year':
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        months.forEach((month, index) => {
          const seasonalMultiplier = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.0, 0.95, 1.1, 1.4, 1.6][index];
          data.push({
            period: month,
            sales: Math.floor((Math.random() * 200000 + 800000) * seasonalMultiplier),
          });
        });
        break;
    }
    return data;
  }

  private generateUserData(timeFrame: string): any[] {
    const data = [];
    const now = new Date();

    switch (timeFrame) {
      case 'hour':
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
          const hourStr = hour.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          const hourOfDay = hour.getHours();
          const baseMultiplier = this.getHourlyMultiplier(hourOfDay);
          data.push({
            period: hourStr,
            activeUsers: Math.floor((Math.random() * 150 + 100) * baseMultiplier),
            newUsers: Math.floor((Math.random() * 25 + 15) * baseMultiplier),
          });
        }
        break;
      case 'day':
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const multiplier = isWeekend ? 1.3 : 1.0;
          const trend = 1 + (29 - i) * 0.01;
          data.push({
            period: dateStr,
            activeUsers: Math.floor((Math.random() * 1200 + 1800) * multiplier * trend),
            newUsers: Math.floor((Math.random() * 180 + 220) * multiplier * trend),
          });
        }
        break;
      case 'week':
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        weekDays.forEach((day, index) => {
          const isWeekend = index >= 5;
          const multiplier = isWeekend ? 1.4 : 1.0;
          data.push({
            period: day,
            activeUsers: Math.floor((Math.random() * 1500 + 2500) * multiplier),
            newUsers: Math.floor((Math.random() * 200 + 300) * multiplier),
          });
        });
        break;
      case 'month':
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const trend = 1 + (29 - i) * 0.008;
          data.push({
            period: dateStr,
            activeUsers: Math.floor((Math.random() * 2000 + 3000) * trend),
            newUsers: Math.floor((Math.random() * 250 + 350) * trend),
          });
        }
        break;
      case 'year':
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        months.forEach((month, index) => {
          const seasonalMultiplier = [0.9, 0.85, 0.95, 1.0, 1.05, 1.1, 1.15, 1.05, 1.0, 1.1, 1.3, 1.4][index];
          data.push({
            period: month,
            activeUsers: Math.floor((Math.random() * 8000 + 22000) * seasonalMultiplier),
            newUsers: Math.floor((Math.random() * 1200 + 2800) * seasonalMultiplier),
          });
        });
        break;
    }
    return data;
  }

  private generateCustomerSegmentationData(): any[] {
    return [
      { name: "Regular", value: 1, color: "#374151" }, // Dark grey for regular customers
      { name: "Silver", value: 0, color: "#9CA3AF" }, // Light grey for silver
      { name: "Gold", value: 1, color: "#F59E0B" }, // Amber/gold for gold tier
      { name: "Platinum", value: 0, color: "#E5E7EB" }, // Very light grey for platinum
    ];
  }

  private generateBrandSalesData(): any[] {
    return [
      { name: "Nike", value: 1250, color: "#3B82F6" }, // Blue
      { name: "Adidas", value: 980, color: "#10B981" }, // Emerald
      { name: "Apple", value: 750, color: "#F59E0B" }, // Amber
      { name: "Samsung", value: 620, color: "#8B5CF6" }, // Purple
      { name: "Others", value: 400, color: "#6B7280" }  // Gray
    ];
  }

  private generateCategorySalesData(): any[] {
    return [
      { name: "Electronics", value: 2100, color: "#EF4444" }, // Red
      { name: "Fashion", value: 1800, color: "#06B6D4" }, // Cyan
      { name: "Home & Garden", value: 950, color: "#84CC16" }, // Lime
      { name: "Sports", value: 720, color: "#F97316" }, // Orange
      { name: "Books", value: 480, color: "#EC4899" }  // Pink
    ];
  }

  private generateProductSalesData(): any[] {
    return [
      { name: "iPhone 15", value: 850, color: "#6366F1" }, // Indigo
      { name: "Nike Air Max", value: 720, color: "#059669" }, // Emerald
      { name: "MacBook Pro", value: 680, color: "#DC2626" }, // Red
      { name: "Samsung TV", value: 520, color: "#7C3AED" }, // Violet
      { name: "Others", value: 1230, color: "#9CA3AF" }  // Gray
    ];
  }

  private generateDeliveryServiceData(): any[] {
    return [
      { name: "Express Delivery", value: 1850, color: "#059669" }, // Emerald
      { name: "Standard Shipping", value: 1420, color: "#3B82F6" }, // Blue
      { name: "Same Day Delivery", value: 680, color: "#F59E0B" }, // Amber
      { name: "Free Shipping", value: 950, color: "#8B5CF6" }, // Purple
      { name: "International", value: 320, color: "#EF4444" }  // Red
    ];
  }

  // Load dynamic data from API
  private loadBrandSalesData(): void {
    console.log('🔄 Loading brand sales data for timeFrame:', this.currentTimeFrame);
    this.dashboardService.getBrandSalesData(this.currentTimeFrame).subscribe({
      next: (data: any[]) => {
        console.log('✅ Brand sales data received:', data);
        this.brandSalesData = data;
        this.createBrandSalesPieChart();
      },
      error: (error) => {
        console.error('❌ Error loading brand sales data:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
        // Remove static data fallback - show empty chart instead
        this.brandSalesData = [];
        this.createBrandSalesPieChart();
      }
    });
  }

  private loadCategorySalesData(): void {
    console.log('🔄 Loading category sales data for timeFrame:', this.currentTimeFrame);
    this.dashboardService.getCategorySalesData(this.currentTimeFrame).subscribe({
      next: (data: any[]) => {
        console.log('✅ Category sales data received:', data);
        this.categorySalesData = data;
        this.createCategorySalesPieChart();
      },
      error: (error) => {
        console.error('❌ Error loading category sales data:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
        // Remove static data fallback - show empty chart instead
        this.categorySalesData = [];
        this.createCategorySalesPieChart();
      }
    });
  }

  private loadProductSalesData(): void {
    console.log('🔄 Loading product sales data for timeFrame:', this.currentTimeFrame);
    this.dashboardService.getProductSalesData(this.currentTimeFrame).subscribe({
      next: (data: any[]) => {
        console.log('✅ Product sales data received:', data);
        this.productSalesData = data;
        this.createProductSalesPieChart();
      },
      error: (error) => {
        console.error('❌ Error loading product sales data:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
        // Remove static data fallback - show empty chart instead
        this.productSalesData = [];
        this.createProductSalesPieChart();
      }
    });
  }

  private loadDeliveryServiceData(): void {
    console.log('🔄 Loading delivery service data for timeFrame:', this.currentTimeFrame);
    this.dashboardService.getDeliveryServiceData(this.currentTimeFrame).subscribe({
      next: (data: any[]) => {
        console.log('✅ Delivery service data received:', data);
        this.deliveryServiceData = data;
        this.createDeliveryServicePieChart();
      },
      error: (error) => {
        console.error('❌ Error loading delivery service data:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
        // Remove static data fallback - show empty chart instead
        this.deliveryServiceData = [];
        this.createDeliveryServicePieChart();
      }
    });
  }

  private getHourlyMultiplier(hour: number): number {
    const patterns: Record<number, number> = {
      0: 0.2, 1: 0.15, 2: 0.1, 3: 0.1, 4: 0.15, 5: 0.3,
      6: 0.5, 7: 0.7, 8: 0.9, 9: 1.2, 10: 1.4, 11: 1.3,
      12: 1.5, 13: 1.4, 14: 1.2, 15: 1.1, 16: 1.0, 17: 1.3,
      18: 1.6, 19: 1.8, 20: 1.5, 21: 1.2, 22: 0.8, 23: 0.4
    };
    return patterns[hour] || 1.0;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString();
  }

  getPercentChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  updateRevenueTargetChart() {
    if (this.charts['revenueTargetChart']) {
      this.charts['revenueTargetChart'].destroy();
    }
    const canvas = document.getElementById('revenueTargetChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const revenueData = this.salesTrendData.map(d => d.total * 0.72);
    const targetData = (this.salesTrendData.length > 0 && this.revenueTarget > 0)
      ? this.salesTrendData.map(() => this.revenueTarget)
      : [];
    const datasets = [
      {
        label: 'Revenue',
        data: revenueData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 3
      }
    ];
    if (targetData.length > 0) {
      datasets.push({
        label: 'Target',
        data: targetData,
        borderColor: '#64748b',
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.4,
        // @ts-ignore
        borderDash: [8, 6]
      });
    }
    this.charts['revenueTargetChart'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.salesTrendData.map(d => this.getFormattedLabel(d.label)),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
                          callbacks: {
                label: (context: any) => {
                  const val = context.parsed.y;
                  let formatted = val >= 1_000_000
                    ? `$${(val / 1_000_000).toFixed(1)}M`
                    : val >= 1_000
                      ? `$${(val / 1_000).toFixed(1)}k`
                      : `$${val}`;
                  return `${context.dataset.label}: ${formatted}`;
                }
              }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 8,
              callback: (val: any, idx: number) => {
                const label = this.salesTrendData[idx]?.label || '';
                return label ? this.getFormattedLabel(label) : '';
              }
            }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: (val: any) => {
                if (val >= 1_000_000) return (val / 1_000_000) + 'M';
                if (val >= 1_000) return (val / 1_000) + 'k';
                return val;
              }
            }
          }
        }
      }
    });
  }

  updateSalesTrendChart() {
    if (this.currentTimeFrame === 'day' && this.salesTrendData.length > 0) {
      // Fill missing days with 0s for a smooth line
      const days = this.salesTrendData.map(d => d.label);
      const minDay = days.reduce((a, b) => a < b ? a : b);
      const maxDay = days.reduce((a, b) => a > b ? a : b);
      const allDays = this.getAllDays(minDay, maxDay);
      const dayMap = new Map(this.salesTrendData.map(d => [d.label, d.total]));
      const filledData = allDays.map(day => ({ label: day, total: dayMap.get(day) || 0 }));
      const formattedData = filledData.map(d => ({ ...d, period: this.getFormattedLabel(d.label) }));
      this.createEnhancedChart('salesTrendChart', formattedData, ['total'], ['#10b981'], 'area');
    } else {
      // Use default logic for other time frames
    const dataKeys = [];
    const colors = [];
    if (this.showSales) {
        dataKeys.push('total');
      colors.push('#10b981');
      }
      const formattedData = this.salesTrendData.map(d => ({ ...d, period: this.getFormattedLabel(d.label) }));
      this.createEnhancedChart('salesTrendChart', formattedData, dataKeys, colors, 'area');
    }
  }

  updateUserGrowthChart() {
    // Use real trends for active users and new users
    const activeUserTrend = this.salesTrendData.map(d => ({ period: d.label || d.period, activeUsers: d.activeUserCount || 0 }));
    // For new users, use the same trend as in updateUserMetrics
    let newUserTrend: { period: string, newUsers: number }[] = [];
    const now = new Date();
    if (this.currentTimeFrame === 'hour') {
      for (let h = 0; h < 24; h++) {
        const label = h.toString().padStart(2, '0') + ':00';
        const count = this.users.filter(u => {
          const d = new Date(u.joinDate);
          return d.getFullYear() === now.getFullYear() &&
                 d.getMonth() === now.getMonth() &&
                 d.getDate() === now.getDate() &&
                 d.getHours() === h;
        }).length;
        newUserTrend.push({ period: label, newUsers: count });
      }
    } else if (this.currentTimeFrame === 'day') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const label = d.toString().padStart(2, '0');
        const count = this.users.filter(u => {
          const dateObj = new Date(u.joinDate);
          return dateObj.getFullYear() === now.getFullYear() &&
                 dateObj.getMonth() === now.getMonth() &&
                 dateObj.getDate() === d;
        }).length;
        newUserTrend.push({ period: label, newUsers: count });
      }
    } else if (this.currentTimeFrame === 'week') {
      const weeks: { [key: string]: number } = {};
      this.users.forEach(u => {
        const d = new Date(u.joinDate);
        const year = d.getFullYear();
        const week = getISOWeek(d);
        const key = `${year}-W${week}`;
        weeks[key] = (weeks[key] || 0) + 1;
      });
      const currentYear = now.getFullYear();
      const currentWeek = getISOWeek(now);
      const minWeek = Math.max(1, currentWeek - 7);
      for (let w = minWeek; w <= currentWeek; w++) {
        const key = `${currentYear}-W${w}`;
        const count = weeks[key] || 0;
        newUserTrend.push({ period: `W${w}`, newUsers: count });
      }
    } else if (this.currentTimeFrame === 'month') {
      for (let m = 0; m < 12; m++) {
        const label = (m + 1).toString().padStart(2, '0');
        const count = this.users.filter(u => {
          const d = new Date(u.joinDate);
          return d.getFullYear() === now.getFullYear() &&
                 d.getMonth() === m;
        }).length;
        newUserTrend.push({ period: label, newUsers: count });
      }
    } else if (this.currentTimeFrame === 'year') {
      const years = Array.from(new Set(this.users.map(u => new Date(u.joinDate).getFullYear()))).sort();
      years.forEach(y => {
        const count = this.users.filter(u => new Date(u.joinDate).getFullYear() === y).length;
        newUserTrend.push({ period: y.toString(), newUsers: count });
      });
    }
    // Merge trends for chart
    const mergedTrend = activeUserTrend.map((a, i) => ({
      period: this.getFormattedLabel(a.period),
      activeUsers: a.activeUsers,
      newUsers: newUserTrend[i] ? newUserTrend[i].newUsers : 0
    }));
    const dataKeys = [];
    const colors = [];
    if (this.showActiveUsers) {
      dataKeys.push('activeUsers');
      colors.push('#3b82f6');
    }
    if (this.showNewUsers) {
      dataKeys.push('newUsers');
      colors.push('#10b981');
    }
    this.createEnhancedChart('userGrowthChart', mergedTrend, dataKeys, colors, 'area');
  }

  updateEngagementChart() {
    // Use real engagement trends data from backend
    if (this.engagementTrends.length > 0) {
      const engagementData = this.engagementTrends.map(trend => ({
        period: this.getFormattedLabel(trend.period),
        views: trend.views || 0,
        engagement: trend.engagement || 0
      }));
      
      const dataKeys = [];
      const colors = [];
      if (this.showViews) {
        dataKeys.push('views');
        colors.push('#8b5cf6');
      }
      if (this.showEngagement) {
        dataKeys.push('engagement');
        colors.push('#f59e0b');
      }
      this.createEnhancedChart('profileViewsChart', engagementData, dataKeys, colors, 'area');
    } else {
      // Fallback to empty chart if no data
      const emptyData = [{ period: 'No Data', views: 0, engagement: 0 }];
      this.createEnhancedChart('profileViewsChart', emptyData, ['views', 'engagement'], ['#8b5cf6', '#f59e0b'], 'area');
    }
  }

  updateCustomerAcqChart() {
    console.log('updateCustomerAcqChart called');
    console.log('customerAcquisitionData:', this.customerAcquisitionData);
    
    // Use real customer acquisition data from backend
    let acquisitionData;
    if (this.customerAcquisitionData.length > 0) {
      acquisitionData = this.customerAcquisitionData.map(d => ({
        period: this.getFormattedLabel(d.period),
        acquired: d.acquired || 0,
        churned: d.churned || 0,
        retained: d.retained || 0
      }));
      console.log('Processed acquisitionData:', acquisitionData);
    } else {
      // Fallback to empty data if no real data available
      acquisitionData = [{ period: 'No Data', acquired: 0, churned: 0, retained: 0 }];
      console.log('Using fallback data:', acquisitionData);
    }
    
    const dataKeys: string[] = [];
    const colors: string[] = [];
    if (this.showAcquired) {
      dataKeys.push('acquired');
      colors.push('#10b981');
    }
    if (this.showChurned) {
      dataKeys.push('churned');
      colors.push('#ef4444');
    }
    if (this.showRetained) {
      dataKeys.push('retained');
      colors.push('#3b82f6');
    }
    
    console.log('dataKeys:', dataKeys);
    console.log('colors:', colors);
    console.log('showAcquired:', this.showAcquired);
    console.log('showChurned:', this.showChurned);
    console.log('showRetained:', this.showRetained);
    
    // Check if canvas exists
    const canvas = document.getElementById('customerAcquisitionChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('customerAcquisitionChart canvas not found');
      return;
    }
    
    // Check if we have any data to show
    if (dataKeys.length === 0) {
      console.log('No data keys selected, not creating chart');
      return;
    }
    
    // Verify data structure
    console.log('Final data structure:');
    acquisitionData.forEach((item: any, index) => {
      console.log(`Item ${index}:`, item);
      dataKeys.forEach(key => {
        console.log(`  ${key}:`, item[key], typeof item[key]);
      });
    });
    
    this.createEnhancedChart('customerAcquisitionChart', acquisitionData, dataKeys, colors, 'area');
    
    // Create pie chart for customer distribution
    this.createCustomerDistributionPieChart();
  }
  
  createCustomerDistributionPieChart() {
    console.log('Creating customer distribution pie chart...');
    const ctx = document.getElementById('customerDistributionChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Canvas element not found');
      return;
    }
    
    // Destroy existing chart if it exists
    if (this.customerDistributionChart) {
      this.customerDistributionChart.destroy();
    }
    
    // Filter out zero values and prepare data for pie chart
    const filteredData = this.segmentationData.filter(tier => tier.value > 0);
    const labels = filteredData.map(tier => tier.name);
    const data = filteredData.map(tier => tier.value);
    const colors = filteredData.map(tier => tier.color);
    
    // Define professional tier icons
    const tierIcons: { [key: string]: string } = {
      'Regular': '👤',
      'Silver': '🥈',
      'Gold': '🥇',
      'Platinum': '👑',
      'Diamond': '💎',
      'Ruby': '💎',
      'Emerald': '💎',
      'default': '👤'
    };
    
    this.customerDistributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.map(label => `${tierIcons[label] || tierIcons['default']} ${label}`),
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 4,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 25,
              usePointStyle: true,
              pointStyle: 'circle',
                              font: {
                  size: 13,
                  weight: 600,
                  family: 'Inter, system-ui, sans-serif'
                },
              color: '#374151',
              generateLabels: function(chart: any) {
                const data = chart.data;
                if (data.labels && data.labels.length && data.datasets && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i] as number;
                    const total = dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    
                    return {
                      text: `${label} (${value} - ${percentage}%)`,
                      fillStyle: dataset.backgroundColor[i],
                      strokeStyle: dataset.backgroundColor[i],
                      lineWidth: 0,
                      pointStyle: 'circle',
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#ffffff',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function(context: any) {
                return context[0].label.replace(/[👤🥈🥇👑💎]/g, '').trim();
              },
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `Customers: ${value} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  createBrandSalesPieChart() {
    console.log('📈 Creating brand sales pie chart with data:', this.brandSalesData);
    const ctx = document.getElementById('brandSalesChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('❌ Brand sales canvas element not found');
      return;
    }
    
    // Destroy existing chart if it exists
    if (this.brandSalesChart) {
      this.brandSalesChart.destroy();
    }
    
    // Use actual data (not static generation)
    const filteredData = this.brandSalesData.filter(item => item.value > 0);
    console.log('📊 Filtered brand sales data:', filteredData);
    
    // Check if we have data
    if (filteredData.length === 0) {
      // Show "No Data" message
      this.brandSalesChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['No Data'],
          datasets: [{
            data: [1],
            backgroundColor: ['#f3f4f6'],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 800,
            easing: 'easeOutQuart'
          }
        }
      });
      
      // Add "No Data" text overlay
      const chartContainer = ctx.parentElement;
      if (chartContainer) {
        let noDataText = chartContainer.querySelector('.no-data-text');
        if (!noDataText) {
          noDataText = document.createElement('div');
          noDataText.className = 'no-data-text absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-medium';
          noDataText.textContent = 'No brand sales data available';
          chartContainer.appendChild(noDataText);
        }
      }
      return;
    }
    
    // Remove any existing "No Data" text
    const chartContainer = ctx.parentElement;
    if (chartContainer) {
      const noDataText = chartContainer.querySelector('.no-data-text');
      if (noDataText) {
        noDataText.remove();
      }
    }
    
    const labels = filteredData.map(item => item.name);
    const data = filteredData.map(item => item.value);
    const colors = filteredData.map(item => item.color);
    
    this.brandSalesChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 9,
                weight: 400,
                family: 'Inter, system-ui, sans-serif'
              },
              color: '#374151',
              generateLabels: function(chart: any) {
                const data = chart.data;
                if (data.labels && data.labels.length && data.datasets && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i] as number;
                    const total = dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
                    
                    // Truncate long labels and show only percentage
                    const shortLabel = label.length > 8 ? label.substring(0, 8) + '...' : label;
                    
                    return {
                      text: `${shortLabel} ${percentage}%`,
                      fillStyle: dataset.backgroundColor[i],
                      strokeStyle: dataset.backgroundColor[i],
                      lineWidth: 0,
                      pointStyle: 'circle',
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#ffffff',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} sales (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  createCategorySalesPieChart() {
    console.log('📈 Creating category sales pie chart with data:', this.categorySalesData);
    const ctx = document.getElementById('categorySalesChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('❌ Category sales canvas element not found');
      return;
    }
    
    // Destroy existing chart if it exists
    if (this.categorySalesChart) {
      this.categorySalesChart.destroy();
    }
    
    // Use actual data (not static generation)
    const filteredData = this.categorySalesData.filter(item => item.value > 0);
    console.log('📊 Filtered category sales data:', filteredData);
    
    // Check if we have data
    if (filteredData.length === 0) {
      // Show "No Data" message
      this.categorySalesChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['No Data'],
          datasets: [{
            data: [1],
            backgroundColor: ['#f3f4f6'],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 800,
            easing: 'easeOutQuart'
          }
        }
      });
      
      // Add "No Data" text overlay
      const chartContainer = ctx.parentElement;
      if (chartContainer) {
        let noDataText = chartContainer.querySelector('.no-data-text');
        if (!noDataText) {
          noDataText = document.createElement('div');
          noDataText.className = 'no-data-text absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-medium';
          noDataText.textContent = 'No category sales data available';
          chartContainer.appendChild(noDataText);
        }
      }
      return;
    }
    
    // Remove any existing "No Data" text
    const chartContainer = ctx.parentElement;
    if (chartContainer) {
      const noDataText = chartContainer.querySelector('.no-data-text');
      if (noDataText) {
        noDataText.remove();
      }
    }
    
    const labels = filteredData.map(item => item.name);
    const data = filteredData.map(item => item.value);
    const colors = filteredData.map(item => item.color);
    
    this.categorySalesChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 9,
                weight: 400,
                family: 'Inter, system-ui, sans-serif'
              },
              color: '#374151',
              generateLabels: function(chart: any) {
                const data = chart.data;
                if (data.labels && data.labels.length && data.datasets && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i] as number;
                    const total = dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
                    
                    // Truncate long labels and show only percentage
                    const shortLabel = label.length > 8 ? label.substring(0, 8) + '...' : label;
                    
                    return {
                      text: `${shortLabel} ${percentage}%`,
                      fillStyle: dataset.backgroundColor[i],
                      strokeStyle: dataset.backgroundColor[i],
                      lineWidth: 0,
                      pointStyle: 'circle',
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#ffffff',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} sales (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  createProductSalesPieChart() {
    console.log('📈 Creating product sales pie chart with data:', this.productSalesData);
    const ctx = document.getElementById('productSalesChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('❌ Product sales canvas element not found');
      return;
    }
    
    // Destroy existing chart if it exists
    if (this.productSalesChart) {
      this.productSalesChart.destroy();
    }
    
    // Use actual data (not static generation)
    const filteredData = this.productSalesData.filter(item => item.value > 0);
    console.log('📊 Filtered product sales data:', filteredData);
    
    // Check if we have data
    if (filteredData.length === 0) {
      // Show "No Data" message
      this.productSalesChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['No Data'],
          datasets: [{
            data: [1],
            backgroundColor: ['#f3f4f6'],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 800,
            easing: 'easeOutQuart'
          }
        }
      });
      
      // Add "No Data" text overlay
      const chartContainer = ctx.parentElement;
      if (chartContainer) {
        let noDataText = chartContainer.querySelector('.no-data-text');
        if (!noDataText) {
          noDataText = document.createElement('div');
          noDataText.className = 'no-data-text absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-medium';
          noDataText.textContent = 'No product sales data available';
          chartContainer.appendChild(noDataText);
        }
      }
      return;
    }
    
    // Remove any existing "No Data" text
    const chartContainer = ctx.parentElement;
    if (chartContainer) {
      const noDataText = chartContainer.querySelector('.no-data-text');
      if (noDataText) {
        noDataText.remove();
      }
    }
    
    const labels = filteredData.map(item => item.name);
    const data = filteredData.map(item => item.value);
    const colors = filteredData.map(item => item.color);
    
    this.productSalesChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 9,
                weight: 400,
                family: 'Inter, system-ui, sans-serif'
              },
              color: '#374151',
              generateLabels: function(chart: any) {
                const data = chart.data;
                if (data.labels && data.labels.length && data.datasets && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i] as number;
                    const total = dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
                    
                    // Truncate long labels and show only percentage
                    const shortLabel = label.length > 8 ? label.substring(0, 8) + '...' : label;
                    
                    return {
                      text: `${shortLabel} ${percentage}%`,
                      fillStyle: dataset.backgroundColor[i],
                      strokeStyle: dataset.backgroundColor[i],
                      lineWidth: 0,
                      pointStyle: 'circle',
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#ffffff',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} sales (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  createDeliveryServicePieChart() {
    console.log('📈 Creating delivery service pie chart with data:', this.deliveryServiceData);
    const ctx = document.getElementById('deliveryServiceChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('❌ Delivery service canvas element not found');
      return;
    }
    
    // Destroy existing chart if it exists
    if (this.deliveryServiceChart) {
      this.deliveryServiceChart.destroy();
    }
    
    // Use actual data (not static generation)
    const filteredData = this.deliveryServiceData.filter(item => item.value > 0);
    console.log('📊 Filtered delivery service data:', filteredData);
    
    // Check if we have data
    if (filteredData.length === 0) {
      // Show "No Data" message
      this.deliveryServiceChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['No Data'],
          datasets: [{
            data: [1],
            backgroundColor: ['#f3f4f6'],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 800,
            easing: 'easeOutQuart'
          }
        }
      });
      
      // Add "No Data" text overlay
      const chartContainer = ctx.parentElement;
      if (chartContainer) {
        let noDataText = chartContainer.querySelector('.no-data-text');
        if (!noDataText) {
          noDataText = document.createElement('div');
          noDataText.className = 'no-data-text absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-medium';
          noDataText.textContent = 'No delivery service data available';
          chartContainer.appendChild(noDataText);
        }
      }
      return;
    }
    
    // Remove any existing "No Data" text
    const chartContainer = ctx.parentElement;
    if (chartContainer) {
      const noDataText = chartContainer.querySelector('.no-data-text');
      if (noDataText) {
        noDataText.remove();
      }
    }
    
    const labels = filteredData.map(item => item.name);
    const data = filteredData.map(item => item.value);
    const colors = filteredData.map(item => item.color);
    
    this.deliveryServiceChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 9,
                weight: 400,
                family: 'Inter, system-ui, sans-serif'
              },
              color: '#374151',
              generateLabels: function(chart: any) {
                const data = chart.data;
                if (data.labels && data.labels.length && data.datasets && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i] as number;
                    const total = dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
                    
                    // Truncate long labels and show only percentage
                    const shortLabel = label.length > 8 ? label.substring(0, 8) + '...' : label;
                    
                    return {
                      text: `${shortLabel} ${percentage}%`,
                      fillStyle: dataset.backgroundColor[i],
                      strokeStyle: dataset.backgroundColor[i],
                      lineWidth: 0,
                      pointStyle: 'circle',
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#ffffff',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: any) => a + (b as number), 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} orders (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  // Format label for chart x-axis based on current time frame
  getFormattedLabel(label: string): string {
    if (this.currentTimeFrame === 'hour') {
      // label: '2025-07-05 02' => '02:00'
      const parts = label.split(' ');
      return parts.length > 1 ? parts[1] + ':00' : label;
    } else if (this.currentTimeFrame === 'day') {
      // label: '2025-07-05' => 'Jul 05'
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      }
      return label;
    } else if (this.currentTimeFrame === 'week') {
      // label: '2025-27' => 'W27'
      const week = label.split('-')[1];
      return 'W' + week;
    } else if (this.currentTimeFrame === 'month') {
      // label: '2025-07' => 'Jul'
      const parts = label.split('-');
      if (parts.length === 2) {
        const date = new Date(parts[0] + '-' + parts[1] + '-01');
        return date.toLocaleDateString('en-US', { month: 'short' });
      }
      return label;
    } else if (this.currentTimeFrame === 'year') {
      // label: '2025' => '2025'
      return label;
    }
    return label;
  }

  // Helper to get all days between two dates (inclusive)
  private getAllDays(start: string, end: string): string[] {
    const dateArray = [];
    let currentDate = parseISO(start);
    const stopDate = parseISO(end);
    while (currentDate <= stopDate) {
      dateArray.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }
    return dateArray;
  }

  getCurrentPeriodValue(): string {
    const now = new Date();
    switch (this.currentTimeFrame) {
      case 'day':
        return now.toISOString().slice(0, 10); // YYYY-MM-DD
      case 'week':
        const week = this.getWeekNumber(now);
        return `${now.getFullYear()}-W${week}`;
      case 'month':
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'year':
        return `${now.getFullYear()}`;
      default:
        return '';
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to UTC 00:00 of the date to get local week number
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Add this method to dynamically update userMetricsData for Active Users and New Users
  private updateUserMetrics(): void {
    // Use real trend data for active users from salesTrendData
    const activeUserTrend = this.salesTrendData.map(d => d.activeUserCount || 0);
    const prevActive = activeUserTrend.length > 1 ? { activeUsers: activeUserTrend[activeUserTrend.length - 2] } : { activeUsers: 0 };
    // Real new user count for summary card and trend
    const now = new Date();
    let newUserCount = 0;
    let newUserTrend: { value: number, label: string }[] = [];
    if (this.currentTimeFrame === 'hour') {
      // 24 hours of today
      for (let h = 0; h < 24; h++) {
        const count = this.users.filter(u => {
          const d = new Date(u.joinDate);
          return d.getFullYear() === now.getFullYear() &&
                 d.getMonth() === now.getMonth() &&
                 d.getDate() === now.getDate() &&
                 d.getHours() === h;
        }).length;
        newUserTrend.push({ value: count, label: h.toString().padStart(2, '0') + ':00' });
        if (h === now.getHours()) newUserCount = count;
      }
      // If current hour is 0, show latest nonzero
      if (newUserCount === 0) {
        const last = newUserTrend.slice().reverse().find(t => t.value > 0);
        if (last) newUserCount = last.value;
      }
    } else if (this.currentTimeFrame === 'day') {
      // Each day of this month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const count = this.users.filter(u => {
          const dateObj = new Date(u.joinDate);
          return dateObj.getFullYear() === now.getFullYear() &&
                 dateObj.getMonth() === now.getMonth() &&
                 dateObj.getDate() === d;
        }).length;
        newUserTrend.push({ value: count, label: d.toString().padStart(2, '0') });
        if (d === now.getDate()) newUserCount = count;
      }
      // If current day is 0, show latest nonzero
      if (newUserCount === 0) {
        const last = newUserTrend.slice().reverse().find(t => t.value > 0);
        if (last) newUserCount = last.value;
      }
    } else if (this.currentTimeFrame === 'week') {
      // Group by ISO week of the year
      const weeks: { [key: string]: number } = {};
      this.users.forEach(u => {
        const d = new Date(u.joinDate);
        const year = d.getFullYear();
        const week = getISOWeek(d);
        const key = `${year}-W${week}`;
        weeks[key] = (weeks[key] || 0) + 1;
      });
      // Show at least the last 8 weeks of the current year
      const currentYear = now.getFullYear();
      const currentWeek = getISOWeek(now);
      const minWeek = Math.max(1, currentWeek - 7);
      for (let w = minWeek; w <= currentWeek; w++) {
        const key = `${currentYear}-W${w}`;
        const count = weeks[key] || 0;
        newUserTrend.push({ value: count, label: `W${w}` });
        if (w === currentWeek) newUserCount = count;
      }
      // If current week is 0, show latest nonzero
      if (newUserCount === 0) {
        const last = newUserTrend.slice().reverse().find(t => t.value > 0);
        if (last) newUserCount = last.value;
      }
    } else if (this.currentTimeFrame === 'month') {
      // Each month of this year
      for (let m = 0; m < 12; m++) {
        const count = this.users.filter(u => {
          const d = new Date(u.joinDate);
          return d.getFullYear() === now.getFullYear() &&
                 d.getMonth() === m;
        }).length;
        newUserTrend.push({ value: count, label: (m + 1).toString().padStart(2, '0') });
        if (m === now.getMonth()) newUserCount = count;
      }
      if (newUserCount === 0) {
        const last = newUserTrend.slice().reverse().find(t => t.value > 0);
        if (last) newUserCount = last.value;
      }
    } else if (this.currentTimeFrame === 'year') {
      // Last 5 years (or all years in data)
      const years = Array.from(new Set(this.users.map(u => new Date(u.joinDate).getFullYear()))).sort();
      years.forEach(y => {
        const count = this.users.filter(u => new Date(u.joinDate).getFullYear() === y).length;
        newUserTrend.push({ value: count, label: y.toString() });
        if (y === now.getFullYear()) newUserCount = count;
      });
      if (newUserCount === 0) {
        const last = newUserTrend.slice().reverse().find(t => t.value > 0);
        if (last) newUserCount = last.value;
      }
    }
    this.userMetricsData = [
      {
        id: 'active-users',
        title: 'Active Users',
        value: this.formatNumber(this.activeUserCount),
        change: this.getPercentChange(this.activeUserCount, prevActive.activeUsers),
        isPositive: this.activeUserCount >= prevActive.activeUsers,
        chartData: activeUserTrend.map(value => ({ value })),
        chartColor: '#3b82f6'
      },
      {
        id: 'new-users',
        title: 'New Users',
        value: this.formatNumber(newUserCount),
        change: 0, // Could be improved with previous period logic
        isPositive: true,
        chartData: newUserTrend,
        chartColor: '#10b981'
      },
      {
        id: 'sessions',
        title: 'Sessions',
        value: this.formatNumber(this.sessionCount),
        change: 0, // Could be improved with previous period logic
        isPositive: true,
        chartData: [], // Will be populated with session trends
        chartColor: '#f59e0b'
      },
      {
        id: 'bounce-rate',
        title: 'Bounce Rate',
        value: this.bounceRate.toFixed(1) + '%',
        change: 0, // Could be improved with previous period logic
        isPositive: this.bounceRate < 50, // Lower is better
        chartData: [], // Will be populated with bounce rate trends
        chartColor: '#ef4444'
      }
    ];
    this.createUserCharts(this.userMetricsData);
  }

  private updateUserMetricsWithTrends(sessionTrends: any[]): void {
    // Update the existing userMetricsData with session trends
    this.updateUserMetrics();
    
    // Find session and bounce rate metrics and update their chart data
    const sessionMetric = this.userMetricsData.find(m => m.id === 'sessions');
    const bounceRateMetric = this.userMetricsData.find(m => m.id === 'bounce-rate');
    
    console.log('Session Trends:', sessionTrends);
    
    if (sessionMetric && sessionTrends.length > 0) {
      sessionMetric.chartData = sessionTrends.map(trend => ({
        value: trend.totalSessions || 0,
        label: trend.period
      }));
      console.log('Session Metric ChartData:', sessionMetric.chartData);
    }
    
    if (bounceRateMetric && sessionTrends.length > 0) {
      bounceRateMetric.chartData = sessionTrends.map(trend => {
        const totalSessions = trend.totalSessions || 0;
        const bounceSessions = trend.bounceSessions || 0;
        const rate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;
        return {
          value: rate,
          label: trend.period
        };
      });
      console.log('Bounce Rate Metric ChartData:', bounceRateMetric.chartData);
    }
    
    // Recreate charts with updated data after DOM is ready
    setTimeout(() => {
      this.createUserCharts(this.userMetricsData);
    }, 0);
  }
}