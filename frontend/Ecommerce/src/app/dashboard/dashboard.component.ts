import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../services/dashboard.service';
import { RevenueTargetService } from '../services/revenue-target.service';
import { addDays, format, parseISO } from 'date-fns';
import { Observable, from, of } from 'rxjs';
import { switchMap, mergeMap, map, filter, take, catchError } from 'rxjs/operators';

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
  currentTimeFrame: 'hour'|'day'|'month'|'year' = 'day';
  timeFrames = ['hour', 'day', 'month', 'year'] as const;
  timeFrameLabels: Record<string, string> = {
    hour: 'Hourly',
    day: 'Daily',
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
  targetType: string = 'day'; // Track which target type is being displayed
  onlineAdminCount: number = 0;
  users: any[] = [];
  engagementAnalytics: any = {};
  engagementTrends: any[] = [];
  customerSegmentation: any[] = [];
  customerAcquisitionData: any[] = [];
  newUsersCount: number = 0;
  newUsersTrends: any[] = [];
  sessionTrends: any[] = [];
  bounceRateTrends: any[] = [];

  // Sales Analytics Data
  brandSalesData: any[] = [];
  categorySalesData: any[] = [];
  productSalesData: any[] = [];
  deliveryServiceData: any[] = [];

  // Modal properties for chart data
  showChartModal = false;
  modalType: 'brand' | 'category' | 'product' | 'delivery' = 'brand';
  modalTitle = '';
  modalData: any[] = [];
  totalModalValue = 0;

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
    console.log('🚀 Dashboard component initialized');
    console.log('🚀 Dashboard component: ngOnInit started');
    Chart.register(...registerables);
    

    
    this.setupWebSocket();
    this.userService.getCustomers().subscribe(users => {
      console.log('Fetched users:', users); // Log users for debugging
      this.users = users;
      console.log('🚀 Dashboard component: About to call refreshDashboard');
      this.refreshDashboard();
      this.updateUserMetrics();
    });
    
    // Set up periodic refresh every 30 seconds that respects current time frame
    this.updateInterval = setInterval(() => {
      console.log('🔄 Periodic refresh triggered for timeFrame:', this.currentTimeFrame);
      this.refreshDashboard();
    }, 30000); // 30 seconds
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
          // Only update if the WebSocket data matches the current time frame
          // Since WebSocket currently broadcasts with "day" time frame, we'll ignore it
          // when user is viewing "hour" time frame to prevent data inconsistency
          console.log('📡 WebSocket update received, current timeFrame:', this.currentTimeFrame);
          // For now, we'll ignore WebSocket updates to prevent time frame conflicts
          // this.salesTrendData = trend.map((d: any) => ({ ...d, period: d.label }));
          // this.updateDashboardFromWebSocket(trend);
          // this.updateSalesTrendChart();
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
    console.log('🔄 refreshDashboard called with timeFrame:', this.currentTimeFrame);
    console.log('🔄 refreshDashboard: Starting dashboard refresh process');
    
    // Set static data immediately at the beginning
    console.log('📊 Component: Setting static data immediately');
    this.setStaticData();
    
    this.dashboardService.getTotalSales().subscribe(totalSales => {
      console.log('📊 Total sales fetched:', totalSales);
      
      this.dashboardService.getSalesTrend(this.currentTimeFrame).subscribe(trend => {
        console.log('📈 Sales trend data for', this.currentTimeFrame, ':', trend);
        // Map backend 'label' to 'period' for chart compatibility
        this.salesTrendData = trend.map(d => ({ ...d, period: d.label }));
        console.log('📊 Mapped sales trend data:', this.salesTrendData);
        
        this.dashboardService.getOrderCount().subscribe(orderCount => {
          this.orderCount = orderCount;
          console.log('📦 Order count:', orderCount);
          
          this.dashboardService.getActiveUsers(this.currentTimeFrame).subscribe(activeUserCount => {
            this.activeUserCount = activeUserCount;
            console.log('👥 Active users for', this.currentTimeFrame, ':', activeUserCount);
            
            this.dashboardService.getCustomersCount().subscribe(customersCount => {
              this.customersCount = customersCount;
              console.log('👤 Customers count:', customersCount);
              
              this.dashboardService.getPreviousMetrics(this.currentTimeFrame).subscribe(prev => {
                this.previousMetrics = prev;
                console.log('📊 Previous metrics for', this.currentTimeFrame, ':', prev);
                
                this.updateDashboard(totalSales, trend);
                this.updateSalesTrendChart();
                
                // Smart target fetching - get the best available target for current time frame
                this.getBestAvailableTarget().subscribe(res => {
                  this.revenueTarget = res.targetAmount || 0;
                  this.targetType = res.fallbackType || this.currentTimeFrame; // Track which target type is being used
                  console.log(`🎯 Target selected: ${this.targetType} (${this.revenueTarget}) for ${this.currentTimeFrame} time frame`);
                  this.updateRevenueTargetChart();
                  
                  // Fetch session count and bounce rate separately to ensure current values
                  console.log('🔄 Component: Fetching session count for timeFrame:', this.currentTimeFrame);
                  this.dashboardService.getSessionCount(this.currentTimeFrame).subscribe({
                    next: (sessionCount) => {
                      console.log('📊 Component: Received session count:', sessionCount);
                      this.sessionCount = sessionCount;
                      console.log('📈 Component: Updated sessionCount property:', this.sessionCount);
                      
                      // Fetch bounce rate
                      console.log('🔄 Component: Fetching bounce rate for timeFrame:', this.currentTimeFrame);
                      this.dashboardService.getBounceRate(this.currentTimeFrame).subscribe({
                        next: (bounceRate) => {
                          console.log('📊 Component: Received bounce rate:', bounceRate);
                          this.bounceRate = bounceRate;
                          console.log('📈 Component: Updated bounceRate property:', this.bounceRate);
                          console.log('📈 Component: Final values - Count:', this.sessionCount, 'Bounce Rate:', this.bounceRate);
                          
                          // Update only session and bounce rate values
                          this.updateSessionAndBounceRateData();
                        },
                        error: (error) => {
                          console.error('❌ Component: Error fetching bounce rate:', error);
                          this.bounceRate = 0;
                          console.log('📈 Component: Set bounceRate to 0 due to error');
                          this.updateSessionAndBounceRateData();
                        }
                      });
                    },
                    error: (error) => {
                      console.error('❌ Component: Error fetching session count:', error);
                      this.sessionCount = 0;
                      console.log('📈 Component: Set sessionCount to 0 due to error');
                      this.updateSessionAndBounceRateData();
                    }
                  });
                  
                  // Use static engagement analytics data
                  console.log('📊 Component: Using static engagement analytics data');
                  this.engagementAnalytics = {
                    totalPageViews: 1250,
                    avgPageViewsPerSession: 3.2,
                    engagementScore: 78.5,
                    totalSessions: 390
                  };
                  
                  // Use static engagement trends data
                  this.engagementTrends = [
                    { date: '2025-08-01', views: 120, engagement: 85 },
                    { date: '2025-08-02', views: 135, engagement: 78 },
                    { date: '2025-08-03', views: 150, engagement: 82 },
                    { date: '2025-08-04', views: 140, engagement: 79 },
                    { date: '2025-08-05', views: 160, engagement: 88 },
                    { date: '2025-08-06', views: 145, engagement: 81 },
                    { date: '2025-08-07', views: 155, engagement: 85 }
                  ];
                  
                  console.log('📊 Component: Static engagement data set:', this.engagementAnalytics);
                  console.log('📊 Component: Static engagement trends set:', this.engagementTrends);
                  console.log('📊 Component: engagementTrends length:', this.engagementTrends.length);
                  
                      this.updateEngagementChart();

                  // Use static VIP tier data instead of fetching from backend
                  console.log('📊 Component: Using static VIP tier data');
                  const staticVipTierData = [
                    { name: 'Regular', color: '#708090', value: 1 },
                    { name: 'Silver', color: '#C0C0C0', value: 3 },
                    { name: 'Gold', color: '#FFD700', value: 1 },
                    { name: 'Platinum', color: '#E5E4E2', value: 0 }
                  ];
                  
                  this.customerSegmentation = staticVipTierData;
                  this.segmentationData = staticVipTierData;
                  this.totalCustomers = staticVipTierData.filter((tier: any) => tier.value > 0).reduce((sum: number, tier: any) => sum + tier.value, 0);
                  
                  console.log('📊 Component: Static VIP tier data set:', staticVipTierData);
                  console.log('📊 Component: Total customers calculated:', this.totalCustomers);
                  console.log('📊 Component: segmentationData length:', this.segmentationData.length);
                      
                      // Force change detection for tier mini cards
                      this.segmentationData = [...this.segmentationData];
                  console.log('📊 Component: Force updated segmentationData:', this.segmentationData);
                      
                      // Force update the customer distribution chart with proper timing
                  console.log('🔄 Component: Calling updateCustomerDistributionChart');
                      this.updateCustomerDistributionChart();
                      
                  // Also force update engagement chart
                  console.log('🔄 Component: Calling updateEngagementChart');
                  this.updateEngagementChart();
                  
                      this.updateCustomerAcqChart();
                  
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

                  // Fetch new users data
                  this.dashboardService.getNewUsersCount(this.currentTimeFrame).subscribe({
                    next: (newUsersCount: number) => {
                      console.log('New users count received:', newUsersCount);
                      this.newUsersCount = newUsersCount;
                    },
                    error: (error: any) => {
                      console.error('Error fetching new users count:', error);
                      this.newUsersCount = 0;
                    }
                  });

                  this.dashboardService.getNewUsersTrends(this.currentTimeFrame).subscribe({
                    next: (newUsersTrends: any[]) => {
                      console.log('New users trends received:', newUsersTrends);
                      this.newUsersTrends = newUsersTrends;
                      // Also update the user growth chart with the new data
                      setTimeout(() => {
                        this.updateUserGrowthChart();
                      }, 100);
                    },
                    error: (error: any) => {
                      console.error('Error fetching new users trends:', error);
                      // Still update the chart even if there's an error
                      setTimeout(() => {
                        this.updateUserGrowthChart();
                      }, 100);
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

  setStaticData(): void {
    console.log('📊 Component: setStaticData called for timeFrame:', this.currentTimeFrame);
    
    // Set static VIP tier data (same for all time frames)
    console.log('📊 Component: Setting static VIP tier data');
    const staticVipTierData = [
      { name: 'Regular', color: '#708090', value: 1 },
      { name: 'Silver', color: '#C0C0C0', value: 3 },
      { name: 'Gold', color: '#FFD700', value: 1 },
      { name: 'Platinum', color: '#E5E4E2', value: 0 }
    ];
    
    this.customerSegmentation = staticVipTierData;
    this.segmentationData = staticVipTierData;
    this.totalCustomers = staticVipTierData.filter((tier: any) => tier.value > 0).reduce((sum: number, tier: any) => sum + tier.value, 0);
    
    console.log('📊 Component: Static VIP tier data set:', staticVipTierData);
    console.log('📊 Component: Total customers calculated:', this.totalCustomers);
    console.log('📊 Component: segmentationData length:', this.segmentationData.length);
    
    // Force change detection for tier mini cards
    this.segmentationData = [...this.segmentationData];
    console.log('📊 Component: Force updated segmentationData:', this.segmentationData);
    
    // Set static engagement analytics data (same for all time frames)
    console.log('📊 Component: Setting static engagement analytics data');
    this.engagementAnalytics = {
      totalPageViews: 1250,
      avgPageViewsPerSession: 3.2,
      engagementScore: 78.5,
      totalSessions: 390
    };
    
    // Set static engagement trends data (same for all time frames)
    this.engagementTrends = [
      { date: '2025-08-01', views: 120, engagement: 85 },
      { date: '2025-08-02', views: 135, engagement: 78 },
      { date: '2025-08-03', views: 150, engagement: 82 },
      { date: '2025-08-04', views: 140, engagement: 79 },
      { date: '2025-08-05', views: 160, engagement: 88 },
      { date: '2025-08-06', views: 145, engagement: 81 },
      { date: '2025-08-07', views: 155, engagement: 85 }
    ];
    
    console.log('📊 Component: Static engagement data set:', this.engagementAnalytics);
    console.log('📊 Component: Static engagement trends set:', this.engagementTrends);
    console.log('📊 Component: engagementTrends length:', this.engagementTrends.length);
    
    // Force update charts for all time frames
    console.log('🔄 Component: Calling updateCustomerDistributionChart for timeFrame:', this.currentTimeFrame);
    this.updateCustomerDistributionChart();
    
    console.log('🔄 Component: Calling updateEngagementChart for timeFrame:', this.currentTimeFrame);
    this.updateEngagementChart();
    
    console.log('📊 Component: setStaticData completed for timeFrame:', this.currentTimeFrame);
  }

  ngAfterViewInit(): void {
    // Ensure DOM is ready before creating charts
    setTimeout(() => {
      this.initializeDashboardCharts();
      
      // Also ensure customer distribution chart is created if data is available
      if (this.segmentationData && this.segmentationData.length > 0) {
        console.log('🔄 Creating customer distribution chart in ngAfterViewInit');
        this.createCustomerDistributionPieChart();
      }
    }, 100);
  }

  private initializeDashboardCharts(): void {
    console.log('🔄 Initializing dashboard charts...');
    
    // Check if we have data to create charts
    if (this.topMetricsData.length > 0) {
      console.log('📊 Top metrics data available, creating charts...');
      this.createTopMetricsCharts();
    } else {
      console.log('⚠️ No top metrics data available yet');
    }
    
    if (this.salesMetricsData.length > 0) {
      console.log('📈 Sales metrics data available, creating charts...');
      this.createSalesCharts(this.salesMetricsData, 0);
    } else {
      console.log('⚠️ No sales metrics data available yet');
    }
    
    if (this.userMetricsData.length > 0) {
      console.log('👥 User metrics data available, creating charts...');
      this.createUserCharts(this.userMetricsData);
    } else {
      console.log('⚠️ No user metrics data available yet');
    }
    
    // Create customer charts with proper timing
    setTimeout(() => {
      this.createCustomerCharts();
    }, 500);
    
    // Create sales analytics charts with proper timing
    setTimeout(() => {
      this.createSalesAnalyticsCharts();
    }, 1000);
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



  changeTimeFrame(frame: 'hour'|'day'|'month'|'year'): void {
    console.log('🔄 Changing time frame from', this.currentTimeFrame, 'to', frame);
    this.currentTimeFrame = frame;
    
    // Refresh all dashboard data
    this.refreshDashboard();
    
    // Force refresh all charts with proper timing
    setTimeout(() => {
      this.forceRefreshCharts();
    }, 1000);
    
    // Also ensure static data is set and charts are updated for all time frames
    setTimeout(() => {
      console.log('🔄 Force updating static data for time frame:', frame);
      this.setStaticData();
    }, 1500);
  }

  private forceRefreshCharts(): void {
    console.log('🔄 Force refreshing all charts...');
    
    // Create charts in proper order
    this.createTopMetricsCharts();
    this.createSalesCharts(this.salesMetricsData, 0);
    
    // Create user charts
    setTimeout(() => {
      this.createUserCharts(this.userMetricsData);
    }, 300);
    
    // Create customer charts and ensure customer distribution chart is updated
    setTimeout(() => {
      this.createCustomerCharts();
      // Force update customer distribution chart for all time frames
      console.log('🔄 Force updating customer distribution chart for timeFrame:', this.currentTimeFrame);
      this.updateCustomerDistributionChart();
    }, 600);
    
    // Create sales analytics charts
    setTimeout(() => {
      this.createSalesAnalyticsCharts();
    }, 900);
    
    // Also update engagement chart
    setTimeout(() => {
      console.log('🔄 Force updating engagement chart for timeFrame:', this.currentTimeFrame);
      this.updateEngagementChart();
    }, 1200);
    
    console.log('✅ All charts refreshed');
  }

  updateDashboard(totalSales: number, trend: any[]): void {
    console.log('🔄 updateDashboard called with:', { totalSales, trendLength: trend.length, timeFrame: this.currentTimeFrame });
    
    // Use real totalSales, orderCount, activeUserCount, customersCount, and trend for all metrics and chart data
    const prev = this.previousMetrics || {};
    const prevTotalSales = prev.totalSales || 0;
    const prevRevenue = prev.revenue || 0;
    const prevOrders = prev.orders || 0;
    const prevAvgOrder = prev.avgOrder || 0;
    const prevActiveUsersValue3 = prev.activeUsers || 0;
    const prevCustomers = prev.customers || 0;
    
    console.log('📊 Previous metrics:', { prevTotalSales, prevRevenue, prevOrders, prevActiveUsersValue3, prevCustomers });
    
    // Create active users data first
    const activeUsersData = {
      id: 'active-users',
      title: 'Active Users',
      value: this.formatNumber(this.activeUserCount),
      change: 0, // Remove incorrect percentage calculation
      isPositive: true, // Set to true as default
      chartData: trend.map(d => ({ value: d.activeUserCount || 0 })),
      chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
      chartColor: '#A9884A'
    };

    // Create initial metrics with placeholder chart data
    const initialSessionMetric = {
      id: 'sessions',
      title: 'Sessions',
      value: this.formatNumber(prev.sessions || 0),
      change: 0, // Remove incorrect percentage calculation
      isPositive: true, // Set to true as default
      chartData: [],
      chartLabels: [],
      chartColor: '#B08234'
    };

    const initialBounceRateMetric = {
      id: 'bounce-rate',
      title: 'Bounce Rate',
      value: (prev.bounceRate || 0).toFixed(1) + '%',
      change: 0, // Remove incorrect percentage calculation
      isPositive: true, // Set to true as default
      chartData: [],
      chartLabels: [],
      chartColor: '#9E4A43'
    };

    // Update userMetricsData with initial metrics
    this.userMetricsData = [
      activeUsersData,
      initialSessionMetric,
      initialBounceRateMetric,
      ...this.userMetricsData.filter(m => !['active-users', 'sessions', 'bounce-rate'].includes(m.id))
    ];

    // Get session trends from backend and update charts
    this.dashboardService.getSessionTrends(this.currentTimeFrame).subscribe({
      next: (sessionTrends) => {
        console.log('📊 Session trends:', sessionTrends);
        
        // Find and update session metric with real trend data
        const sessionIndex = this.userMetricsData.findIndex(m => m.id === 'sessions');
        if (sessionIndex !== -1) {
          this.userMetricsData[sessionIndex] = {
            ...this.userMetricsData[sessionIndex],
            chartData: sessionTrends.map(d => ({ value: d.totalSessions || 0 })),
            chartLabels: sessionTrends.map(d => this.getFormattedLabel(d.date || d.label))
          };
        }

        // Find and update bounce rate metric with real trend data
        const bounceIndex = this.userMetricsData.findIndex(m => m.id === 'bounce-rate');
        if (bounceIndex !== -1) {
          this.userMetricsData[bounceIndex] = {
            ...this.userMetricsData[bounceIndex],
            chartData: sessionTrends.map(d => ({ 
              value: d.totalSessions > 0 ? (d.bounceSessions / d.totalSessions * 100) : 0 
            })),
            chartLabels: sessionTrends.map(d => this.getFormattedLabel(d.date || d.label))
          };
        }

        // Force array update for change detection
        this.userMetricsData = [...this.userMetricsData];

        // Force chart update
        setTimeout(() => {
          this.createUserCharts(this.userMetricsData);
        }, 0);
      },
      error: (error) => {
        console.error('Error fetching session trends:', error);
      }
    });
    
    this.topMetricsData = [
      {
        id: 'total-sales',
        title: 'Total Sales',
        value: this.formatNumber(totalSales),
        currency: 'MMK',
        change: 0, // Remove incorrect percentage calculation
        isPositive: true, // Set to true as default
        chartData: trend.map(d => ({ value: d.total })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#5F7355'
      },
      {
        id: 'revenue',
        title: 'Revenue',
        value: this.formatNumber(Math.floor(totalSales * 0.72)),
        currency: 'MMK',
        change: 0, // Remove incorrect percentage calculation
        isPositive: true, // Set to true as default
        chartData: trend.map(d => ({ value: d.total * 0.72 })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#C6A667'
      },
      activeUsersData,
      {
        id: 'conversion',
        title: 'Conversion',
        value: this.getRate(this.orderCount, this.activeUserCount).toFixed(1) + '%',
        change: 0, // Remove incorrect percentage calculation
        isPositive: true, // Set to true as default
        chartData: trend.map(d => ({ value: this.getRate(d.orderCount || 0, d.activeUserCount || 1) })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#9E4A43'
      },
      {
        id: 'orders',
        title: 'Orders',
        value: this.formatNumber(this.orderCount),
        change: 0, // Remove incorrect percentage calculation
        isPositive: true, // Set to true as default
        chartData: trend.map(d => ({ value: d.orderCount })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#B08234'
      },
      {
        id: 'customers',
        title: 'Customers',
        value: this.formatNumber(this.customersCount),
        change: 0, // Remove incorrect percentage calculation
        isPositive: true, // Set to true as default
        chartData: trend.map(d => ({ value: d.customersCount || 0 })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#4A5A66'
      }
    ];
    // Show only 4 sales metric cards: Total Sales, Revenue, Orders, Avg Order
    this.salesMetricsData = [
      {
        id: 'total-sales',
        title: 'Total Sales',
        value: this.formatNumber(totalSales),
        currency: 'MMK',
        change: 0, // Remove incorrect percentage calculation
        isPositive: true, // Set to true as default
        chartData: trend.map(d => ({ value: d.total })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#5F7355'
      },
      {
        id: 'revenue',
        title: 'Revenue',
        value: this.formatNumber(Math.floor(totalSales * 0.72)),
        currency: 'MMK',
        change: 0, // Remove incorrect percentage calculation
        isPositive: true, // Set to true as default
        chartData: trend.map(d => ({ value: d.total * 0.72 })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#C6A667'
      },
      {
        id: 'orders',
        title: 'Orders',
        value: this.formatNumber(this.orderCount),
        change: 0, // Remove incorrect percentage calculation
        isPositive: true, // Set to true as default
        chartData: trend.map(d => ({ value: d.orderCount })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#B08234'
      },
      {
        id: 'avg-order',
        title: 'Avg Order',
        value: this.orderCount > 0 ? this.formatNumber(Math.floor(totalSales / this.orderCount)) : '0',
        currency: 'MMK',
        change: 0, // Remove incorrect percentage calculation
        isPositive: true, // Set to true as default
        chartData: trend.map(d => ({ value: d.orderCount > 0 ? Math.floor(d.total / d.orderCount) : 0 })),
        chartLabels: trend.map(d => this.getFormattedLabel(d.label)),
        chartColor: '#9E4A43'
      }
    ];
    // Re-create charts with the new data
    setTimeout(() => {
      console.log('🎨 Creating charts with data:', {
        topMetricsCount: this.topMetricsData.length,
        salesMetricsCount: this.salesMetricsData.length,
        timeFrame: this.currentTimeFrame
      });
      
      // Log chart data for debugging
      this.topMetricsData.forEach(metric => {
        console.log(`📊 Chart data for ${metric.id}:`, {
          title: metric.title,
          dataLength: metric.chartData?.length,
          labelsLength: metric.chartLabels?.length,
          sampleData: metric.chartData?.slice(0, 3)
        });
      });
      
      // Create charts in proper order
      this.createTopMetricsCharts();
      this.createSalesCharts(this.salesMetricsData, 0);
      
      // Create user charts after user metrics are updated
      setTimeout(() => {
        this.createUserCharts(this.userMetricsData);
      }, 500);
      
      // Create customer charts
      setTimeout(() => {
        this.createCustomerCharts();
      }, 1000);
      
      // Create sales analytics charts
      setTimeout(() => {
        this.createSalesAnalyticsCharts();
      }, 1500);
    }, 100);
  }

  private createTopMetricsCharts(): void {
    console.log('🔄 Creating top metrics charts with data:', this.topMetricsData);
    
    this.topMetricsData.forEach((metric, index) => {
      setTimeout(() => {
        if (metric.chartData && metric.chartData.length > 0) {
          console.log(`📊 Creating mini chart for ${metric.id} with ${metric.chartData.length} data points`);
          console.log(`📊 Chart data:`, metric.chartData);
          this.createMiniChart('chart-' + metric.id, metric.chartData, metric.chartColor, 'line', metric.chartLabels);
        } else {
          console.warn(`⚠️ No chart data for metric ${metric.id}, creating fallback`);
          // Create fallback data
          const fallbackData = [0, 0, 0, 0, 0, 0, 0, 0];
          this.createMiniChart('chart-' + metric.id, fallbackData, metric.chartColor, 'line');
        }
      }, index * 100);
    });
  }

  private createSalesCharts(salesData: any[], avgSales: number): void {
    console.log('🔄 Creating sales charts with data:', this.salesMetricsData);
    
    this.salesMetricsData.forEach((metric, index) => {
      setTimeout(() => {
        if (metric.chartData && metric.chartData.length > 0) {
          console.log(`📊 Creating sales mini chart for ${metric.id}`);
          this.createMiniChart('chart-sm-' + metric.id, metric.chartData, metric.chartColor, 'area');
          this.createMiniChart('chart-sm-line-' + metric.id, metric.chartData, metric.chartColor, 'line');
        } else {
          console.warn(`⚠️ No chart data for sales metric ${metric.id}, creating fallback`);
          const fallbackData = [0, 0, 0, 0, 0, 0, 0, 0];
          this.createMiniChart('chart-sm-' + metric.id, fallbackData, metric.chartColor, 'area');
          this.createMiniChart('chart-sm-line-' + metric.id, fallbackData, metric.chartColor, 'line');
        }
      }, index * 150);
    });

    setTimeout(() => {
      this.updateSalesTrendChart();
      this.updateRevenueTargetChart();
    }, 500);
  }

  private createUserCharts(userData: any[]): void {
    console.log('🔄 Creating user charts with data:', this.userMetricsData);
    
    this.userMetricsData.forEach((metric, index) => {
      setTimeout(() => {
        if (metric.chartData && metric.chartData.length > 0) {
          console.log(`📊 Creating user mini chart for ${metric.id}`);
          
          // Extract values from chartData
          let values: number[] = [];
          if (Array.isArray(metric.chartData)) {
            values = metric.chartData.map((d: any) => {
              if (typeof d === 'number') return d;
              if (d && typeof d === 'object') {
                if ('value' in d) return Number(d.value) || 0;
                if ('activeUsers' in d) return Number(d.activeUsers) || 0;
                if ('newUsers' in d) return Number(d.newUsers) || 0;
                if ('totalSessions' in d) return Number(d.totalSessions) || 0;
                if ('bounceRate' in d) return Number(d.bounceRate) || 0;
              }
              return 0;
            });
          }
          
          // Ensure we have at least 8 data points for a smooth line
          if (values.length < 8) {
            const currentLength = values.length;
            for (let i = currentLength; i < 8; i++) {
              values.push(values[i % currentLength] || 0);
            }
          }
          
          console.log(`📊 Values for ${metric.id}:`, values);
          
          // Create area chart
          const areaCanvas = document.getElementById('chart-user-' + metric.id);
          if (areaCanvas) {
            this.createMiniChart('chart-user-' + metric.id, values, metric.chartColor, 'area');
          } else {
            console.warn(`⚠️ Area canvas not found for ${metric.id}`);
          }
          
          // Create line chart
          const lineCanvas = document.getElementById('chart-user-line-' + metric.id);
          if (lineCanvas) {
            this.createMiniChart('chart-user-line-' + metric.id, values, metric.chartColor, 'line');
          } else {
            console.warn(`⚠️ Line canvas not found for ${metric.id}`);
          }
        } else {
          console.warn(`⚠️ No chart data for user metric ${metric.id}, creating fallback`);
          const fallbackData = [0, 0, 0, 0, 0, 0, 0, 0];
          
          // Create fallback area chart
          const areaCanvas = document.getElementById('chart-user-' + metric.id);
          if (areaCanvas) {
          this.createMiniChart('chart-user-' + metric.id, fallbackData, metric.chartColor, 'area');
          }
          
          // Create fallback line chart
          const lineCanvas = document.getElementById('chart-user-line-' + metric.id);
          if (lineCanvas) {
          this.createMiniChart('chart-user-line-' + metric.id, fallbackData, metric.chartColor, 'line');
          }
        }
      }, index * 150);
    });

    setTimeout(() => {
      this.updateUserGrowthChart();
      this.updateEngagementChart();
    }, 600);
  }

  private createCustomerCharts(): void {
    console.log('🔄 createCustomerCharts called');
    console.log('📊 segmentationData:', this.segmentationData);
    console.log('📊 customerAcquisitionData:', this.customerAcquisitionData);
    
    // Create VIP pie chart with proper timing
    setTimeout(() => {
      console.log('🎯 Creating VIP pie chart...');
      this.createCustomerDistributionPieChart();
    }, 200);
    
    // Create Customer Acquisition chart with proper timing
    setTimeout(() => {
      console.log('🎯 Creating Customer Acquisition chart...');
      this.updateCustomerAcqChart();
    }, 400);
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

  private ensureCanvasReady(canvasId: string, maxAttempts: number = 10): Promise<HTMLCanvasElement | null> {
    return new Promise((resolve) => {
      let attempts = 0;
      const checkCanvas = () => {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (canvas) {
          resolve(canvas);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkCanvas, 100);
        } else {
          console.warn(`Canvas ${canvasId} not found after ${maxAttempts} attempts`);
          resolve(null);
        }
      };
      checkCanvas();
    });
  }

  private debugChartCreation(canvasId: string, data: any[]): void {
    console.log(`=== Debug Chart Creation for ${canvasId} ===`);
    console.log('Canvas element:', document.getElementById(canvasId));
    console.log('Data:', data);
    console.log('Data length:', data?.length);
    console.log('Data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('First item:', data[0]);
      console.log('First item type:', typeof data[0]);
      console.log('First item keys:', data[0] ? Object.keys(data[0]) : 'N/A');
    }
    
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (canvas) {
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('Canvas style:', canvas.style.cssText);
      console.log('Canvas parent:', canvas.parentElement);
    }
    console.log('=====================================');
  }

  private isChartJsAvailable(): boolean {
    return typeof Chart !== 'undefined' && Chart !== null;
  }

  private createMiniChartWithRetry(canvasId: string, data: any[], color: string, type = 'line', labels?: string[], retryCount = 0): void {
    const maxRetries = 3;
    
    // Check if Chart.js is available
    if (!this.isChartJsAvailable()) {
      console.error('Chart.js is not available');
      return;
    }
    
    this.ensureCanvasReady(canvasId).then(canvas => {
      if (!canvas) {
        if (retryCount < maxRetries) {
          console.log(`Retrying chart creation for ${canvasId}, attempt ${retryCount + 1}`);
          setTimeout(() => {
            this.createMiniChartWithRetry(canvasId, data, color, type, labels, retryCount + 1);
          }, 200);
        } else {
          console.warn(`Failed to create chart for ${canvasId} after ${maxRetries} attempts`);
        }
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn(`Could not get 2D context for ${canvasId}`);
        return;
      }

      // Destroy existing chart if it exists
      if (this.charts[canvasId]) {
        this.charts[canvasId].destroy();
      }

      // Validate and normalize data
      let normalizedData: number[] = [];
      if (Array.isArray(data) && data.length > 0) {
        normalizedData = data.map(item => {
          if (typeof item === 'number') {
            return item;
          } else if (item && typeof item === 'object' && 'value' in item) {
            return Number(item.value) || 0;
          } else {
            return 0;
          }
        });
      }

      // If no valid data, create a simple flat line
      if (normalizedData.length === 0) {
        normalizedData = [0, 0, 0, 0, 0, 0, 0, 0];
      }

      // Ensure we have at least 2 data points for a line chart
      if (normalizedData.length === 1) {
        normalizedData = [normalizedData[0], normalizedData[0]];
      }

      // Generate labels if not provided
      const chartLabels = labels || normalizedData.map((_, i) => i.toString());

      try {
        this.charts[canvasId] = new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartLabels,
            datasets: [{
              data: normalizedData,
              borderColor: color,
              backgroundColor: type === 'area' ? color + '20' : 'transparent',
              fill: type === 'area',
              tension: 0.4, // Smooth curve
              pointRadius: 0,
              borderWidth: 2,
              borderJoinStyle: 'round',
              borderCapStyle: 'round',
              cubicInterpolationMode: 'monotone', // Ensures smooth curves
              spanGaps: true, // Connect points across gaps
              stepped: false // Ensure smooth lines
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
              legend: { display: false },
              tooltip: { enabled: false }
            },
            scales: { 
              x: { 
                display: false,
                grid: { display: false }
              }, 
              y: { 
                display: false,
                grid: { display: false },
                beginAtZero: true
              } 
            },
            elements: { 
              line: { 
                borderJoinStyle: 'round',
                tension: 0.4
              },
              point: { radius: 0 }
            },
            animation: false,
            interaction: {
              intersect: false,
              mode: 'index'
            }
          }
        });
        console.log(`✅ Successfully created mini chart for ${canvasId}`);
      } catch (error) {
        console.error(`❌ Error creating chart for ${canvasId}:`, error);
        if (retryCount < maxRetries) {
          setTimeout(() => {
            this.createMiniChartWithRetry(canvasId, data, color, type, labels, retryCount + 1);
          }, 300);
        }
      }
    });
  }

  private createMiniChart(canvasId: string, data: any[], color: string, type = 'line', labels?: string[]): void {
    this.createMiniChartWithRetry(canvasId, data, color, type, labels);
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
    if (previous === 0) {
      // If previous was 0 and current is not 0, it's a 100% increase
      return current > 0 ? 100 : 0;
    }
    const change = ((current - previous) / previous) * 100;
    // Cap at 100% to avoid extreme values and round to 1 decimal place
    const cappedChange = Math.max(-100, Math.min(100, change));
    return Math.round(cappedChange * 10) / 10;
  }

  getRate(current: number, total: number): number {
    if (total === 0) return 0;
    const rate = (current / total) * 100;
    // Rates should be capped at 100%
    return Math.min(100, Math.max(0, rate));
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
        borderColor: '#C6A667',
        backgroundColor: 'rgba(198,166,103,0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 3
      }
    ];
    if (targetData.length > 0) {
      const targetLabel = this.targetType !== this.currentTimeFrame ? 
        `Target (${this.targetType})` : 'Target';
      datasets.push({
        label: targetLabel,
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
      this.createEnhancedChart('salesTrendChart', formattedData, ['total'], ['#5F7355'], 'area');
    } else {
      // Use default logic for other time frames
    const dataKeys = [];
    const colors = [];
    if (this.showSales) {
        dataKeys.push('total');
      colors.push('#5F7355');
      }
      const formattedData = this.salesTrendData.map(d => ({ ...d, period: this.getFormattedLabel(d.label) }));
      this.createEnhancedChart('salesTrendChart', formattedData, dataKeys, colors, 'area');
    }
  }

  updateUserGrowthChart() {
    console.log('🔄 updateUserGrowthChart called');
    console.log('📊 salesTrendData for chart:', this.salesTrendData);
    console.log('👥 newUsersTrends for chart:', this.newUsersTrends);
    
    // For active users, fill missing days with zeros for a smooth line
    let activeUserTrend: { period: string, activeUsers: number }[] = [];
    if (this.currentTimeFrame === 'day') {
      // Get the last 30 days up to today
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const allDays = this.getAllDays(
        thirtyDaysAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      
      // Create a map of existing data
      const dayMap = new Map(
        this.salesTrendData
          .filter(d => d.label) // Filter out any entries without labels
          .map(d => [d.label, d.activeUserCount || 0])
      );
      
      // Fill in all days, using existing data or 0
      activeUserTrend = allDays.map(day => ({ 
        period: day,
        activeUsers: dayMap.get(day) || 0 
      }));
    } else {
      // Use default logic for other time frames
      activeUserTrend = this.salesTrendData.map(d => ({ 
        period: d.label || d.period, 
        activeUsers: d.activeUserCount || 0 
      }));
    }
    console.log('📈 Active User Trend for chart:', activeUserTrend);
    
    // For new users, use the backend trends data if available, otherwise generate from users array
    let newUserTrend: { period: string, newUsers: number }[] = [];
    
    if (this.newUsersTrends && this.newUsersTrends.length > 0) {
      // Use real backend data and fill missing days for day time frame
      console.log('✅ Using real new users trends for chart');
      if (this.currentTimeFrame === 'day') {
        // Get the last 30 days up to today
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const allDays = this.getAllDays(
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        
        // Create a map of existing data
        const dayMap = new Map(
          this.newUsersTrends
            .filter(d => d.period) // Filter out any entries without period
            .map(d => [d.period, d.newUsers || 0])
        );
        
        // Fill in all days, using existing data or 0
        newUserTrend = allDays.map(day => ({
          period: day,
          newUsers: dayMap.get(day) || 0
        }));
      } else {
      newUserTrend = this.newUsersTrends.map(trend => ({
        period: trend.period || '',
        newUsers: trend.newUsers || 0
      }));
      }
      console.log('👥 New User Trend for chart:', newUserTrend);
    } else {
      // Fallback to generated data if backend data is not available
      console.log('⚠️ No new users trends for chart, using fallback data');
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
    }
    
    // Merge trends for chart - ensure both arrays have the same length
    const maxLength = Math.max(activeUserTrend.length, newUserTrend.length);
    const mergedTrend = [];
    
    for (let i = 0; i < maxLength; i++) {
      const activeData = activeUserTrend[i] || { period: '', activeUsers: 0 };
      const newUserData = newUserTrend[i] || { period: '', newUsers: 0 };
      
      mergedTrend.push({
        period: this.getFormattedLabel(activeData.period || newUserData.period),
        activeUsers: activeData.activeUsers,
        newUsers: newUserData.newUsers
      });
    }
    
    console.log('📊 Merged trend data for chart:', mergedTrend);
    
    const dataKeys = [];
    const colors = [];
    if (this.showActiveUsers) {
      dataKeys.push('activeUsers');
      colors.push('#C6A667');
    }
    if (this.showNewUsers) {
      dataKeys.push('newUsers');
      colors.push('#5F7355');
    }
    
    console.log('🎨 Chart dataKeys:', dataKeys);
    console.log('🎨 Chart colors:', colors);
    
    this.createEnhancedChart('userGrowthChart', mergedTrend, dataKeys, colors, 'area');
  }

  updateEngagementChart() {
    console.log('🔄 updateEngagementChart called');
    console.log('📊 engagementTrends:', this.engagementTrends);
    
    // Use static engagement data if available, otherwise use backend data
    if (this.engagementTrends && this.engagementTrends.length > 0) {
      console.log('✅ Using engagement trends data');
      const engagementData = this.engagementTrends.map(trend => ({
        period: this.getFormattedLabel(trend.period || trend.date),
        views: trend.views || 0,
        engagement: trend.engagement || 0
      }));
      
      const dataKeys = [];
      const colors = [];
      if (this.showViews) {
        dataKeys.push('views');
        colors.push('#A9884A');
      }
      if (this.showEngagement) {
        dataKeys.push('engagement');
        colors.push('#B08234');
      }
      
      console.log('📊 Engagement data for chart:', engagementData);
      console.log('🎨 dataKeys:', dataKeys);
      console.log('🎨 colors:', colors);
      
      this.createEnhancedChart('profileViewsChart', engagementData, dataKeys, colors, 'area');
    } else {
      console.log('⚠️ No engagement trends data, using fallback data');
      // Fallback to empty chart if no data
      const emptyData = [{ period: 'No Data', views: 0, engagement: 0 }];
      this.createEnhancedChart('profileViewsChart', emptyData, ['views', 'engagement'], ['#A9884A', '#B08234'], 'area');
    }
  }

  updateCustomerAcqChart() {
    console.log('🔄 updateCustomerAcqChart called for timeFrame:', this.currentTimeFrame);
    console.log('📊 customerAcquisitionData from backend:', this.customerAcquisitionData);
    
    // Use real data from backend if available, otherwise generate fallback data
    let acquisitionData = [];
    
    if (this.customerAcquisitionData && this.customerAcquisitionData.length > 0) {
      // Use real data from backend
      console.log('✅ Using real customer acquisition data from backend');
      acquisitionData = this.customerAcquisitionData.map(item => ({
        period: item.period || '',
        acquired: item.acquired || 0,
        churned: item.churned || 0,
        retained: item.retained || 0
      }));
    } else {
      // Generate fallback data if backend data is not available
      console.log('⚠️ No customer acquisition data from backend, using fallback data');
      const now = new Date();
      
      switch (this.currentTimeFrame) {
        case 'hour':
          // Generate 24 hours of data
          for (let i = 0; i < 24; i++) {
            const hour = (now.getHours() - 23 + i + 24) % 24;
            const hourStr = hour.toString().padStart(2, '0') + ':00';
            
            acquisitionData.push({
              period: hourStr,
              acquired: Math.floor(Math.random() * 5),
              churned: Math.floor(Math.random() * 2),
              retained: Math.floor(Math.random() * 3)
            });
          }
          break;
          
        case 'day':
          // Generate 7 days of data
          for (let i = 0; i < 7; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - 6 + i);
            const dayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            acquisitionData.push({
              period: dayStr,
              acquired: Math.floor(Math.random() * 10),
              churned: Math.floor(Math.random() * 3),
              retained: Math.floor(Math.random() * 7)
            });
          }
          break;
          
        case 'month':
          // Generate 12 months of data
          for (let i = 0; i < 12; i++) {
            const month = new Date(now.getFullYear(), i, 1);
            const monthStr = month.toLocaleDateString('en-US', { month: 'short' });
            
            acquisitionData.push({
              period: monthStr,
              acquired: Math.floor(Math.random() * 50),
              churned: Math.floor(Math.random() * 15),
              retained: Math.floor(Math.random() * 35)
            });
          }
          break;
          
        case 'year':
          // Generate 5 years of data
          const currentYear = new Date().getFullYear();
          for (let i = 0; i < 5; i++) {
            const year = currentYear - 4 + i;
            const yearStr = year.toString();
            
            acquisitionData.push({
              period: yearStr,
              acquired: Math.floor(Math.random() * 200),
              churned: Math.floor(Math.random() * 60),
              retained: Math.floor(Math.random() * 140)
            });
          }
          break;
      }
    }
    
    console.log(`📊 Final acquisition data for ${this.currentTimeFrame}:`, acquisitionData);
    
    const dataKeys: string[] = [];
    const colors: string[] = [];
    if (this.showAcquired) {
      dataKeys.push('acquired');
      colors.push('#5F7355');
    }
    if (this.showChurned) {
      dataKeys.push('churned');
      colors.push('#9E4A43');
    }
    if (this.showRetained) {
      dataKeys.push('retained');
      colors.push('#C6A667');
    }
    
    console.log('🎨 dataKeys:', dataKeys);
    console.log('🎨 colors:', colors);
    console.log('👁️ showAcquired:', this.showAcquired);
    console.log('👁️ showChurned:', this.showChurned);
    console.log('👁️ showRetained:', this.showRetained);
    
    // Check if canvas exists
    const canvas = document.getElementById('customerAcquisitionChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('❌ customerAcquisitionChart canvas not found');
      return;
    }
    
    // Check if we have any data to show
    if (dataKeys.length === 0) {
      console.log('⚠️ No data keys selected, not creating chart');
      return;
    }
    
    // Verify data structure
    console.log('📋 Final data structure:');
    acquisitionData.forEach((item: any, index) => {
      console.log(`Item ${index}:`, item);
      dataKeys.forEach(key => {
        console.log(`  ${key}:`, item[key], typeof item[key]);
      });
    });
    
    this.createCustomerAcquisitionChart(acquisitionData, dataKeys, colors);
    
    // Create pie chart for customer distribution
    setTimeout(() => {
      this.createCustomerDistributionPieChart();
    }, 100);
  }
  
  createCustomerAcquisitionChart(data: any[], dataKeys: string[], colors: string[]): void {
    console.log('createCustomerAcquisitionChart called with:', { data, dataKeys, colors });
    
    const canvas = document.getElementById('customerAcquisitionChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('customerAcquisitionChart canvas not found');
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context for customerAcquisitionChart');
      return;
    }
    
    // Destroy existing chart if it exists
    if (this.charts['customerAcquisitionChart']) {
      console.log('Destroying existing customerAcquisitionChart');
      this.charts['customerAcquisitionChart'].destroy();
    }
    
    // Data is already in correct order with current date in 5th position
    const customLabels = data.map((d: any) => this.getFormattedLabel(d.period));
    const customData = [...data];
    
    const datasets = dataKeys.map((key, index) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, colors[index] + '40');
      gradient.addColorStop(1, colors[index] + '05');
      
      const dataValues = customData.map((d: any) => {
        const value = d[key];
        console.log(`Data point for ${key}:`, value, typeof value);
        return value;
      });
      
      const dataset = {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        data: dataValues,
        borderColor: colors[index],
        backgroundColor: 'area' === 'area' ? gradient : 'transparent',
        borderWidth: 3,
        fill: 'area' === 'area',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: colors[index],
        pointBorderWidth: 2,
        pointBorderColor: '#ffffff',
        pointStyle: 'circle',
        borderDash: [],
        borderDashOffset: 0,
      };
      
      console.log(`Created dataset for ${key}:`, dataset);
      console.log(`Data values for ${key}:`, dataValues);
      return dataset;
    });
    
    console.log('Final datasets:', datasets);
    console.log('Custom Labels:', customLabels);
    console.log('Custom Data length:', customData.length);
    
    // Check if we have enough data points for lines
    if (customData.length < 2) {
      console.warn('Not enough data points for line chart. Need at least 2 points.');
    }
    
    this.charts['customerAcquisitionChart'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: customLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
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
              display: true,
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
    
    console.log(`Customer Acquisition Chart created:`, this.charts['customerAcquisitionChart']);
    
    // Force chart update
    setTimeout(() => {
      if (this.charts['customerAcquisitionChart']) {
        this.charts['customerAcquisitionChart'].update();
        console.log(`Customer Acquisition Chart updated`);
      }
    }, 100);
  }
  
  updateCustomerDistributionChart() {
    console.log('🔄 Updating customer distribution chart...');
    console.log('📊 Current segmentation data:', this.segmentationData);
    
    // Force update the customer distribution chart with proper timing
    setTimeout(() => {
      console.log('🔄 Forcing customer distribution chart update with data:', this.segmentationData);
      this.createCustomerDistributionPieChart();
    }, 200);
    
    // Retry if chart creation fails
    setTimeout(() => {
      if (!this.customerDistributionChart) {
        console.log('🔄 Retrying customer distribution chart creation...');
        this.createCustomerDistributionPieChart();
      }
    }, 500);
  }

  createCustomerDistributionPieChart() {
    console.log('🔄 Creating customer distribution pie chart...');
    console.log('📊 segmentationData:', this.segmentationData);
    console.log('📊 segmentationData length:', this.segmentationData.length);
    console.log('📊 segmentationData type:', typeof this.segmentationData);
    
    const ctx = document.getElementById('customerDistributionChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('❌ Customer distribution canvas element not found');
      console.log('🔍 Available canvas elements:', document.querySelectorAll('canvas'));
      return;
    }
    
    console.log('✅ Canvas element found:', ctx);
    
    // Destroy existing chart if it exists
    if (this.customerDistributionChart) {
      console.log('🗑️ Destroying existing customer distribution chart');
      this.customerDistributionChart.destroy();
    }
    
    // Filter out zero values and prepare data for pie chart
    const filteredData = this.segmentationData.filter(tier => tier.value > 0);
    console.log('📊 Filtered data for pie chart:', filteredData);
    console.log('📊 Filtered data length:', filteredData.length);
    
    if (filteredData.length === 0) {
      console.log('⚠️ No data to display in pie chart, creating empty chart');
      // Create empty chart with placeholder
      this.customerDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['No Data'],
          datasets: [{
            data: [1],
            backgroundColor: ['#e5e7eb'],
            borderColor: '#ffffff',
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            }
          }
        }
      });
      return;
    }
    
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
    
    console.log('🎨 Labels:', labels);
    console.log('📊 Data:', data);
    console.log('🎨 Colors:', colors);
    console.log('📊 Total data points:', data.length);
    console.log('📊 Data sum:', data.reduce((sum, val) => sum + val, 0));
    
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
    
    console.log('✅ Customer distribution pie chart created successfully');
    console.log('📊 Chart data verification:', {
      labels: this.customerDistributionChart.data.labels,
      datasets: this.customerDistributionChart.data.datasets[0].data,
      totalDataPoints: this.customerDistributionChart.data.datasets[0].data.length
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
            display: false
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
            display: false
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
            display: false
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
            display: false
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
      // Handle different hour formats from backend
      if (label.includes(' ')) {
        const parts = label.split(' ');
        if (parts.length >= 2) {
          const timePart = parts[1];
          // Handle formats like "02:00" or "02"
          if (timePart.includes(':')) {
            return timePart; // Return "02:00"
          } else {
            return timePart + ':00'; // Return "02:00"
          }
        }
      }
      // If it's just a number like "2", convert to "02:00"
      if (/^\d{1,2}$/.test(label)) {
        return label.padStart(2, '0') + ':00';
      }
      return label;
    } else if (this.currentTimeFrame === 'day') {
      // label: '2025-07-05' => 'Jul 05'
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      }
      return label;
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

      case 'month':
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'year':
        return `${now.getFullYear()}`;
      default:
        return '';
    }
  }

  // Smart target fetching - gets the best available target for current time frame
  private getBestAvailableTarget(): Observable<any> {
    const now = new Date();
    const currentDay = now.toISOString().slice(0, 10);
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const currentYear = `${now.getFullYear()}`;

    // Try to get target for current time frame first
    return this.revenueTargetService.getTarget(this.currentTimeFrame, this.getCurrentPeriodValue()).pipe(
      switchMap(res => {
        if (res.targetAmount && res.targetAmount > 0) {
          // Target exists for current time frame
          return of(res);
        } else {
          // No target for current time frame, try fallback hierarchy
          return this.getFallbackTarget();
        }
      })
    );
  }

  // Get fallback target based on hierarchy
  private getFallbackTarget(): Observable<any> {
    const now = new Date();
    const currentDay = now.toISOString().slice(0, 10);
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const currentYear = `${now.getFullYear()}`;

    // Fallback hierarchy: year -> month -> day
    const fallbackSequence = [
      { periodType: 'year', periodValue: currentYear },
      { periodType: 'month', periodValue: currentMonth },
      { periodType: 'day', periodValue: currentDay }
    ];

    // Remove current time frame from fallback sequence
    const filteredSequence = fallbackSequence.filter(item => 
      !(item.periodType === this.currentTimeFrame && item.periodValue === this.getCurrentPeriodValue())
    );

    // Try each fallback target
    return from(filteredSequence).pipe(
      mergeMap(item => 
        this.revenueTargetService.getTarget(item.periodType, item.periodValue).pipe(
          map(res => ({ ...res, fallbackType: item.periodType }))
        )
      ),
      filter(res => res.targetAmount && res.targetAmount > 0),
      take(1),
      catchError(() => of({ targetAmount: 0 }))
    );
  }



  // Add this method to dynamically update userMetricsData for Active Users and New Users
  private updateUserMetrics(): void {
    console.log('🔄 updateUserMetrics called');
    console.log('📊 salesTrendData:', this.salesTrendData);
    console.log('👥 newUsersTrends:', this.newUsersTrends);
    
    // Use exact same logic as top section - no need for complex calculations
    console.log('👤 Current Active Users (from API):', this.activeUserCount);
    console.log('👤 Previous Active Users (from previous metrics):', this.previousMetrics?.activeUsers || 0);
    
    // Calculate change percentage for active users (removed incorrect calculation)
    const prevActiveUsersValue = this.previousMetrics?.activeUsers || 0;
    
    // Use real new users data from backend - get current day's new users from trend
    let newUserCount = 0;
    let newUserTrend: { value: number, label: string }[] = [];
    
    // Use real new users trends if available, otherwise fallback to generated data
    if (this.newUsersTrends && this.newUsersTrends.length > 0) {
      console.log('✅ Using real new users trends from backend');
      newUserTrend = this.newUsersTrends.map(trend => ({
        value: trend.newUsers || 0,
        label: trend.period || ''
      }));
      // Get current day's new users count from trends
      newUserCount = newUserTrend.length > 0 ? newUserTrend[newUserTrend.length - 1].value : 0;
      console.log('👥 New User Trend (processed):', newUserTrend);
      console.log('👥 Current New Users Count:', newUserCount);
    } else {
      console.log('⚠️ No new users trends from backend, using fallback data');
      // Fallback to generated data if backend data is not available
      const now = new Date();
      
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
      } else if (this.currentTimeFrame === 'year') {
        // Last 5 years (or all years in data)
        const years = Array.from(new Set(this.users.map(u => new Date(u.joinDate).getFullYear()))).sort();
        years.forEach(y => {
          const count = this.users.filter(u => new Date(u.joinDate).getFullYear() === y).length;
          newUserTrend.push({ value: count, label: y.toString() });
          if (y === now.getFullYear()) newUserCount = count;
        });
      }
    }

    // Get previous new users count for percentage calculation
    const previousNewUsers = newUserTrend.length > 1 ? newUserTrend[newUserTrend.length - 2].value : 0;
    console.log('👥 Previous New Users Count:', previousNewUsers);

    // Use real session trends if available, otherwise generate fallback data
    let sessionTrend: { value: number, label: string }[] = [];
    if (this.sessionTrends && this.sessionTrends.length > 0) {
      if (this.currentTimeFrame === 'day') {
        // For day time frame, fill missing days with zeros
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const allDays = this.getAllDays(
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        
        const dayMap = new Map(
          this.sessionTrends
            .filter(d => d.period)
            .map(d => [d.period, d.totalSessions || 0])
        );
        
        sessionTrend = allDays.map(day => ({
          value: dayMap.get(day) || 0,
          label: day
        }));
      } else {
        // For other time frames, use the trend data as is
      sessionTrend = this.sessionTrends.map((trend: any) => ({
        value: trend.totalSessions || 0,
        label: trend.period || ''
      }));
      }
    } else {
      // Generate fallback session trend data
      sessionTrend = this.generateSessionTrendData();
    }
    
    // Use real bounce rate trends if available, otherwise generate fallback data
    let bounceRateTrend: { value: number, label: string }[] = [];
    if (this.bounceRateTrends && this.bounceRateTrends.length > 0) {
      if (this.currentTimeFrame === 'day') {
        // For day time frame, fill missing days with zeros
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const allDays = this.getAllDays(
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        
        const dayMap = new Map(
          this.bounceRateTrends
            .filter(d => d.period)
            .map(d => [d.period, d.bounceRate || 0])
        );
        
        bounceRateTrend = allDays.map(day => ({
          value: dayMap.get(day) || 0,
          label: day
        }));
      } else {
        // For other time frames, use the trend data as is
      bounceRateTrend = this.bounceRateTrends.map((trend: any) => ({
        value: trend.bounceRate || 0,
        label: trend.period || ''
      }));
      }
    } else {
      // Generate fallback bounce rate trend data
      bounceRateTrend = this.generateBounceRateTrendData();
    }

    console.log('🔍 Debug - User Engagement Active Users:');
    console.log('  - this.activeUserCount:', this.activeUserCount);
    console.log('  - this.previousMetrics?.activeUsers:', this.previousMetrics?.activeUsers);
    console.log('  - this.salesTrendData.length:', this.salesTrendData.length);
    console.log('  - this.salesTrendData:', this.salesTrendData);
    
    // Use exact same logic as top section - get the same trend data
    const prev = this.previousMetrics || {};
    const prevActiveUsersValue2 = prev.activeUsers || 0;
    
    console.log('  - Using same logic as top section:');
    console.log('  - this.activeUserCount:', this.activeUserCount);
    console.log('  - prevActiveUsersValue2:', prevActiveUsersValue2);
    console.log('  - this.salesTrendData:', this.salesTrendData);

    this.userMetricsData = [
      {
        id: 'active-users',
        title: 'Active Users',
        value: this.formatNumber(this.activeUserCount),
        change: 0, // Remove incorrect percentage calculation
        isPositive: true, // Set to true as default
        chartData: this.salesTrendData.map(d => ({ value: d.activeUserCount || 0 })),
        chartColor: '#C6A667'
      },
      {
        id: 'new-users',
        title: 'New Users',
        value: this.formatNumber(newUserCount), // Use current from trend data
        change: 0, // Remove incorrect percentage calculation
        isPositive: newUserCount >= previousNewUsers,
        chartData: newUserTrend,
        chartColor: '#5F7355'
      },
      {
        id: 'sessions',
        title: 'Sessions',
        value: this.formatNumber(this.sessionCount), // Use direct API value
        change: 0, // Could be improved with previous period logic
        isPositive: true,
        chartData: this.generateStaticSessionTrend(),
        chartColor: '#B08234'
      },
      {
        id: 'bounce-rate',
        title: 'Bounce Rate',
        value: this.bounceRate.toFixed(1) + '%', // Use direct API value
        change: 0, // Could be improved with previous period logic
        isPositive: this.bounceRate < 50, // Lower is better
        chartData: this.generateStaticBounceRateTrend(),
        chartColor: '#9E4A43'
      }
    ];
    
    // Force change detection by creating new array reference
    this.userMetricsData = [...this.userMetricsData];
    
    console.log('📊 Final userMetricsData:', this.userMetricsData);
    
    // Create user charts with a delay to ensure DOM is ready
    setTimeout(() => {
      this.createUserCharts(this.userMetricsData);
    }, 200);
  }

  private generateSessionTrendData(): { value: number, label: string }[] {
    const now = new Date();
    const trend: { value: number, label: string }[] = [];
    
    if (this.currentTimeFrame === 'hour') {
      // Generate 24 hours of session data
      for (let h = 0; h < 24; h++) {
        const baseSessions = this.sessionCount / 24; // Distribute sessions across hours
        const multiplier = this.getHourlyMultiplier(h);
        const sessions = Math.round(baseSessions * multiplier);
        trend.push({ value: sessions, label: h.toString().padStart(2, '0') + ':00' });
      }
    } else if (this.currentTimeFrame === 'day') {
      // Generate daily session data
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const baseSessions = this.sessionCount / daysInMonth;
        const multiplier = 0.8 + Math.random() * 0.4; // Random variation
        const sessions = Math.round(baseSessions * multiplier);
        trend.push({ value: sessions, label: d.toString().padStart(2, '0') });
      }

    } else if (this.currentTimeFrame === 'month') {
      // Generate monthly session data
      for (let m = 1; m <= 12; m++) {
        const baseSessions = this.sessionCount / 12;
        const multiplier = 0.6 + Math.random() * 0.8; // Random variation
        const sessions = Math.round(baseSessions * multiplier);
        trend.push({ value: sessions, label: m.toString().padStart(2, '0') });
      }
    } else if (this.currentTimeFrame === 'year') {
      // Generate yearly session data
      for (let y = now.getFullYear() - 4; y <= now.getFullYear(); y++) {
        const baseSessions = this.sessionCount / 5;
        const multiplier = 0.5 + Math.random() * 1.0; // Random variation
        const sessions = Math.round(baseSessions * multiplier);
        trend.push({ value: sessions, label: y.toString() });
      }
    }
    
    return trend;
  }

  private generateBounceRateTrendData(): { value: number, label: string }[] {
    const now = new Date();
    const trend: { value: number, label: string }[] = [];
    const baseBounceRate = this.bounceRate;
    
    if (this.currentTimeFrame === 'hour') {
      // Generate 24 hours of bounce rate data
      for (let h = 0; h < 24; h++) {
        const variation = (Math.random() - 0.5) * 20; // ±10% variation
        const bounceRate = Math.max(0, Math.min(100, baseBounceRate + variation));
        trend.push({ value: bounceRate, label: h.toString().padStart(2, '0') + ':00' });
      }
    } else if (this.currentTimeFrame === 'day') {
      // Generate daily bounce rate data
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const variation = (Math.random() - 0.5) * 15; // ±7.5% variation
        const bounceRate = Math.max(0, Math.min(100, baseBounceRate + variation));
        trend.push({ value: bounceRate, label: d.toString().padStart(2, '0') });
      }

    } else if (this.currentTimeFrame === 'month') {
      // Generate monthly bounce rate data
      for (let m = 1; m <= 12; m++) {
        const variation = (Math.random() - 0.5) * 10; // ±5% variation
        const bounceRate = Math.max(0, Math.min(100, baseBounceRate + variation));
        trend.push({ value: bounceRate, label: m.toString().padStart(2, '0') });
      }
    } else if (this.currentTimeFrame === 'year') {
      // Generate yearly bounce rate data
      for (let y = now.getFullYear() - 4; y <= now.getFullYear(); y++) {
        const variation = (Math.random() - 0.5) * 8; // ±4% variation
        const bounceRate = Math.max(0, Math.min(100, baseBounceRate + variation));
        trend.push({ value: bounceRate, label: y.toString() });
      }
    }
    
    return trend;
  }

  private generateStaticSessionTrend(): { value: number, label: string }[] {
    // Create static session trend with a nice curve pattern
    const staticData = [
      { value: 2, label: '1' },
      { value: 4, label: '2' },
      { value: 3, label: '3' },
      { value: 6, label: '4' },
      { value: 5, label: '5' },
      { value: 8, label: '6' },
      { value: 7, label: '7' },
      { value: 9, label: '8' }
    ];
    return staticData;
  }

  private generateStaticBounceRateTrend(): { value: number, label: string }[] {
    // Create static bounce rate trend with a nice curve pattern
    const staticData = [
      { value: 85, label: '1' },
      { value: 90, label: '2' },
      { value: 88, label: '3' },
      { value: 95, label: '4' },
      { value: 92, label: '5' },
      { value: 98, label: '6' },
      { value: 96, label: '7' },
      { value: 100, label: '8' }
    ];
    return staticData;
  }

    private updateSessionAndBounceRateData(): void {
    console.log('🔄 Component: updateSessionAndBounceRateData called');
    console.log('📊 Component: Current values - Session Count:', this.sessionCount, 'Bounce Rate:', this.bounceRate);
    
    // Create new metrics array from scratch
    const newMetrics = [
      // Keep existing metrics that aren't sessions or bounce rate
      ...this.userMetricsData.filter(m => !['sessions', 'bounce-rate'].includes(m.id)),
      
      // Add session metric using current sessionCount
      {
        id: 'sessions',
        title: 'Sessions',
        value: this.formatNumber(this.sessionCount),
        change: 0,
        isPositive: true,
        chartData: this.generateStaticSessionTrend(),
        chartColor: '#B08234'
      },
      
      // Add bounce rate metric using current bounceRate
      {
        id: 'bounce-rate',
        title: 'Bounce Rate',
        value: this.bounceRate.toFixed(1) + '%',
        change: 0,
        isPositive: this.bounceRate < 50,
        chartData: this.generateStaticBounceRateTrend(),
        chartColor: '#9E4A43'
      }
    ];

    // Update metrics and force change detection
    this.userMetricsData = newMetrics;
    console.log('📈 Component: Updated metrics:', {
      sessions: this.userMetricsData.find(m => m.id === 'sessions'),
      bounceRate: this.userMetricsData.find(m => m.id === 'bounce-rate')
    });
    console.log('📈 Component: Final userMetricsData length:', this.userMetricsData.length);
  }

  private updateUserMetricsWithTrends(sessionTrends: any[]): void {
    // Find session and bounce rate metrics and update their chart data
    const sessionMetric = this.userMetricsData.find(m => m.id === 'sessions');
    const bounceRateMetric = this.userMetricsData.find(m => m.id === 'bounce-rate');
    
    console.log('Session Trends:', sessionTrends);
    
    if (sessionMetric && sessionTrends.length > 0) {
      // Process session trends based on time frame
      if (this.currentTimeFrame === 'day') {
        // For day time frame, fill missing days with zeros
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const allDays = this.getAllDays(
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        
        const dayMap = new Map(
          sessionTrends
            .filter(d => d.period)
            .map(d => [d.period, d.totalSessions || 0])
        );
        
        sessionMetric.chartData = allDays.map(day => ({
          value: dayMap.get(day) || 0,
          label: day
        }));
      } else if (this.currentTimeFrame === 'hour') {
        // For hour time frame, ensure 24 hours
        const hourMap = new Map(
          sessionTrends
            .filter(d => d.period)
            .map(d => [d.period, d.totalSessions || 0])
        );
        
        const hours = Array.from({ length: 24 }, (_, i) => 
          i.toString().padStart(2, '0') + ':00'
        );
        
        sessionMetric.chartData = hours.map(hour => ({
          value: hourMap.get(hour) || 0,
          label: hour
        }));
      } else if (this.currentTimeFrame === 'month') {
        // For month time frame, ensure all months
        const monthMap = new Map(
          sessionTrends
            .filter(d => d.period)
            .map(d => [d.period, d.totalSessions || 0])
        );
        
        const months = Array.from({ length: 12 }, (_, i) => 
          (i + 1).toString().padStart(2, '0')
        );
        
        sessionMetric.chartData = months.map(month => ({
          value: monthMap.get(month) || 0,
          label: month
        }));
      } else {
        // For year time frame, use as is
      sessionMetric.chartData = sessionTrends.map(trend => ({
        value: trend.totalSessions || 0,
        label: trend.period
      }));
      }
      console.log('Session Metric ChartData:', sessionMetric.chartData);
    }
    
    if (bounceRateMetric && sessionTrends.length > 0) {
      // Process bounce rate trends based on time frame
      if (this.currentTimeFrame === 'day') {
        // For day time frame, fill missing days with zeros
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const allDays = this.getAllDays(
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        
        const dayMap = new Map(
          sessionTrends
            .filter(d => d.period)
            .map(d => {
              const totalSessions = d.totalSessions || 0;
              const bounceSessions = d.bounceSessions || 0;
              const rate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;
              return [d.period, rate];
            })
        );
        
        bounceRateMetric.chartData = allDays.map(day => ({
          value: dayMap.get(day) || 0,
          label: day
        }));
      } else if (this.currentTimeFrame === 'hour') {
        // For hour time frame, ensure 24 hours
        const hourMap = new Map(
          sessionTrends
            .filter(d => d.period)
            .map(d => {
              const totalSessions = d.totalSessions || 0;
              const bounceSessions = d.bounceSessions || 0;
              const rate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;
              return [d.period, rate];
            })
        );
        
        const hours = Array.from({ length: 24 }, (_, i) => 
          i.toString().padStart(2, '0') + ':00'
        );
        
        bounceRateMetric.chartData = hours.map(hour => ({
          value: hourMap.get(hour) || 0,
          label: hour
        }));
      } else if (this.currentTimeFrame === 'month') {
        // For month time frame, ensure all months
        const monthMap = new Map(
          sessionTrends
            .filter(d => d.period)
            .map(d => {
              const totalSessions = d.totalSessions || 0;
              const bounceSessions = d.bounceSessions || 0;
              const rate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;
              return [d.period, rate];
            })
        );
        
        const months = Array.from({ length: 12 }, (_, i) => 
          (i + 1).toString().padStart(2, '0')
        );
        
        bounceRateMetric.chartData = months.map(month => ({
          value: monthMap.get(month) || 0,
          label: month
        }));
      } else {
        // For year time frame, use as is
      bounceRateMetric.chartData = sessionTrends.map(trend => {
        const totalSessions = trend.totalSessions || 0;
        const bounceSessions = trend.bounceSessions || 0;
        const rate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;
        return {
          value: rate,
          label: trend.period
        };
      });
      }
      console.log('Bounce Rate Metric ChartData:', bounceRateMetric.chartData);
    }
    
    // Recreate charts with updated data after DOM is ready
    setTimeout(() => {
      this.createUserCharts(this.userMetricsData);
    }, 0);
  }

  // Modal methods
  openChartModal(type: 'brand' | 'category' | 'product' | 'delivery'): void {
    this.modalType = type;
    
    // Set modal title based on type
    const titles = {
      brand: 'Brand Sales Details',
      category: 'Category Sales Details', 
      product: 'Product Sales Details',
      delivery: 'Delivery Service Details'
    };
    this.modalTitle = titles[type];
    
    // Get data based on type
    let data: any[] = [];
    switch (type) {
      case 'brand':
        data = this.brandSalesData;
        break;
      case 'category':
        data = this.categorySalesData;
        break;
      case 'product':
        data = this.productSalesData;
        break;
      case 'delivery':
        data = this.deliveryServiceData;
        break;
    }
    
    // Filter out zero values and calculate percentages
    const filteredData = data.filter(item => item.value > 0);
    const total = filteredData.reduce((sum, item) => sum + item.value, 0);
    
    this.modalData = filteredData.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
    }));
    
    this.totalModalValue = total;
    this.showChartModal = true;
  }

  closeChartModal(): void {
    this.showChartModal = false;
    this.modalData = [];
    this.totalModalValue = 0;
  }

  trackByItem(index: number, item: any): any {
    return item.name;
  }

  exportModalData(): void {
    // Create CSV content
    const headers = ['Name', 'Value', 'Percentage', 'Color'];
    const csvContent = [
      headers.join(','),
      ...this.modalData.map(item => 
        `"${item.name}",${item.value},${item.percentage}%,${item.color}`
      )
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.modalTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private createFallbackChart(canvasId: string, data: any[], color: string): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    // Create a simple SVG fallback
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 100 30');
    
    // Clear canvas and append SVG
    canvas.innerHTML = '';
    canvas.appendChild(svg);
    
    // Create a simple line chart
    if (data && data.length > 0) {
      const normalizedData = data.map(item => {
        if (typeof item === 'number') return item;
        if (item && typeof item === 'object' && 'value' in item) return Number(item.value) || 0;
        return 0;
      });
      
      if (normalizedData.length > 1) {
        const maxValue = Math.max(...normalizedData);
        const minValue = Math.min(...normalizedData);
        const range = maxValue - minValue || 1;
        
        const points = normalizedData.map((value, index) => {
          const x = (index / (normalizedData.length - 1)) * 100;
          const y = 30 - ((value - minValue) / range) * 25;
          return `${x},${y}`;
        }).join(' ');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${points}`);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
      }
    }
  }

  private resizeCharts(): void {
    Object.keys(this.charts).forEach(chartId => {
      const chart = this.charts[chartId];
      if (chart) {
        chart.resize();
      }
    });
  }
}