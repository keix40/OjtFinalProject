import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../services/dashboard.service';
import { RevenueTargetService } from '../services/revenue-target.service';
import { addDays, format, parseISO } from 'date-fns';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule]
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
  previousMetrics: any = {};
  revenueTarget: number = 0;
  onlineAdminCount: number = 0;

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

  constructor(
    private dashboardService: DashboardService,
    private revenueTargetService: RevenueTargetService,
    // private adminUserService: AdminUserService,
  ) { }

  ngOnInit(): void {
    Chart.register(...registerables);
    this.setupWebSocket();
    this.refreshDashboard();
    this.updateInterval = setInterval(() => {
      if (!this.wsConnected) {
        this.refreshDashboard();
      }
    }, 30000);
  }

  setupWebSocket(): void {
    this.stompClient = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new (SockJS as any)('http://localhost:8080/ws'),
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
                });
              });
            });
          });
        });
      });
    });
    // this.fetchOnlineAdminCount();
  }

  ngAfterViewInit(): void {}

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
  }

  changeTimeFrame(frame: 'hour'|'day'|'week'|'month'|'year'): void {
    this.currentTimeFrame = frame;
    this.refreshDashboard();
    this.updateSalesTrendChart();
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
        value: `$${this.formatNumber(totalSales)}`,
        change: this.getPercentChange(totalSales, prevTotalSales),
        isPositive: totalSales >= prevTotalSales,
        chartData: trend.map(d => ({ value: d.total })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#10b981'
      },
      {
        id: 'revenue',
        title: 'Revenue',
        value: `$${this.formatNumber(Math.floor(totalSales * 0.72))}`,
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
        value: `$${this.formatNumber(totalSales)}`,
        change: this.getPercentChange(totalSales, prevTotalSales),
        isPositive: totalSales >= prevTotalSales,
        chartData: trend.map(d => ({ value: d.total })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#10b981'
      },
      {
        id: 'revenue',
        title: 'Revenue',
        value: `$${this.formatNumber(Math.floor(totalSales * 0.72))}`,
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
        value: this.orderCount > 0 ? `$${this.formatNumber(Math.floor(totalSales / this.orderCount))}` : '$0',
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

  private createMiniChart(canvasId: string, data: any[], color: string, type = 'line', labels?: string[]): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, color + '80');
    gradient.addColorStop(1, color + '10');
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
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2
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
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    const datasets = dataKeys.map((key, index) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, colors[index] + '40');
      gradient.addColorStop(1, colors[index] + '05');
      return {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        data: data.map((d: any) => d[key]),
        borderColor: colors[index],
        backgroundColor: type === 'area' ? gradient : 'transparent',
        borderWidth: 3,
        fill: type === 'area',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 3,
        pointBorderColor: colors[index],
        pointStyle: 'point',
      };
    });
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
            display: false,
            labels: {
              usePointStyle: true,
              pointStyle: 'point',
              font: { size: 12, weight: 500 }
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
              display: false,
              drawTicks: false
            },
            ticks: { 
              color: '#94a3b8', 
              font: { size: 11, weight: 500 },
              maxTicksLimit: 8
            }
          },
          y: {
            grid: { 
              color: '#f1f5f9',
              drawTicks: false
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 11, weight: 500 },
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
      { name: "Platinum", value: 2450, color: "#FFD700" },
      { name: "Diamond", value: 1890, color: "#00CED1" },
      { name: "Silver", value: 3420, color: "#C0C0C0" },
      { name: "No Level", value: 5240, color: "#708090" },
    ];
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
    const userData = this.generateUserData(this.currentTimeFrame);
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
    this.createEnhancedChart('userGrowthChart', userData, dataKeys, colors, 'area');
  }

  updateEngagementChart() {
    const userData = this.generateUserData(this.currentTimeFrame);
    const profileViewsData = userData.map((item: any, index: number) => ({
      period: item.period,
      views: item.activeUsers * 0.6 + Math.sin(index) * 200,
      engagement: item.activeUsers * 0.4 + Math.cos(index) * 150
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
    this.createEnhancedChart('profileViewsChart', profileViewsData, dataKeys, colors, 'area');
  }

  updateCustomerAcqChart() {
    const acquisitionData = Array.from({ length: 12 }, (_, i) => ({
      period: `Month ${i + 1}`,
      acquired: 150 + Math.sin(i * 0.5) * 50 + Math.random() * 30,
      churned: 20 + Math.random() * 15,
      retained: 130 + Math.cos(i * 0.3) * 40 + Math.random() * 25
    }));
    const dataKeys = [];
    const colors = [];
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
    this.createEnhancedChart('customerAcquisitionChart', acquisitionData, dataKeys, colors, 'area');
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
}