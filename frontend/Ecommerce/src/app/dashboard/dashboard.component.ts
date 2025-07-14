import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

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

  constructor() { }

  ngOnInit(): void {
    Chart.register(...registerables);
    this.updateDashboard();
    this.updateInterval = setInterval(() => {
      this.updateDashboard();
    }, 30000);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    Object.values(this.charts).forEach(chart => chart.destroy());
  }

  changeTimeFrame(frame: 'hour'|'day'|'week'|'month'|'year'): void {
    this.currentTimeFrame = frame;
    setTimeout(() => {
      this.updateDashboard();
    }, 300);
  }

  updateDashboard(): void {
    const salesData = this.generateSalesData(this.currentTimeFrame);
    const userData = this.generateUserData(this.currentTimeFrame);
    this.segmentationData = this.generateCustomerSegmentationData();

    // Calculate summary metrics
    const totalSales = salesData.reduce((sum: number, item: any) => sum + item.sales, 0);
    const totalUsers = userData.reduce((sum: number, item: any) => sum + item.activeUsers, 0);
    this.totalCustomers = this.segmentationData.reduce((sum: number, item: any) => sum + item.value, 0);

    // Calculate engagement rate
    const totalActiveUsers = userData.reduce((sum: number, item: any) => sum + item.activeUsers, 0);
    const totalNewUsers = userData.reduce((sum: number, item: any) => sum + item.newUsers, 0);
    this.engagementRate = totalActiveUsers > 0 ? (totalNewUsers / totalActiveUsers) * 100 : 0;

    // Update top metrics
    this.topMetricsData = [
      { id: 'total-sales', title: 'Total Sales', value: `$${this.formatNumber(totalSales)}`, change: 12.5, isPositive: true, chartData: salesData.slice(-8).map(item => ({ value: item.sales })), chartColor: '#10b981' },
      { id: 'revenue', title: 'Revenue', value: `$${this.formatNumber(Math.floor(totalSales * 0.72))}`, change: 8.3, isPositive: true, chartData: salesData.slice(-8).map(item => ({ value: item.sales * 0.72 })), chartColor: '#3b82f6' },
      { id: 'active-users', title: 'Active Users', value: this.formatNumber(totalUsers), change: 15.7, isPositive: true, chartData: userData.slice(-8).map(item => ({ value: item.activeUsers })), chartColor: '#8b5cf6' },
      { id: 'conversion', title: 'Conversion', value: '3.2%', change: -1.2, isPositive: false, chartData: salesData.slice(-8).map(d => ({ value: d.sales * 0.032 })), chartColor: '#ef4444' },
      { id: 'orders', title: 'Orders', value: this.formatNumber(Math.floor(totalSales / 150)), change: 22.1, isPositive: true, chartData: salesData.slice(-8).map(d => ({ value: d.sales / 150 })), chartColor: '#f59e0b' },
      { id: 'customers', title: 'Customers', value: this.formatNumber(this.totalCustomers), change: 5.8, isPositive: true, chartData: Array.from({ length: 8 }, (_, i) => ({ value: this.totalCustomers + Math.sin(i) * 100 })), chartColor: '#06b6d4' }
    ];

    // Update sales metrics
    const avgSales = salesData.length > 0 ? totalSales / salesData.length : 0;
    const firstValue = salesData[0]?.sales || 0;
    const lastValue = salesData[salesData.length - 1]?.sales || 0;
    const growthPercentage = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    this.salesMetricsData = [
      { id: 'sales-total', title: 'Total Sales', value: `$${this.formatNumber(totalSales)}`, change: growthPercentage, isPositive: growthPercentage >= 0, chartData: salesData.slice(-10).map(item => ({ value: item.sales })), chartColor: '#10b981' },
      { id: 'sales-revenue', title: 'Revenue', value: `$${this.formatNumber(Math.floor(totalSales * 0.72))}`, change: 24.5, isPositive: true, chartData: salesData.slice(-8).map(item => ({ value: item.sales * 0.72 })), chartColor: '#3b82f6' },
      { id: 'sales-orders', title: 'Orders', value: this.formatNumber(Math.floor(totalSales / 100)), change: 12.3, isPositive: true, chartData: salesData.slice(-6).map(item => ({ value: Math.floor(item.sales / 100) + Math.random() * 50 })), chartColor: '#8b5cf6' },
      { id: 'sales-avg', title: 'Avg Order', value: `$${Math.floor(avgSales / 10)}`, change: -2.1, isPositive: false, chartData: salesData.slice(-10).map(d => ({ value: d.sales / 10 })), chartColor: '#ef4444' }
    ];

    // Update user metrics
    this.userMetricsData = [
      { id: 'user-active', title: 'Active Users', value: this.formatNumber(totalActiveUsers), change: 18.5, isPositive: true, chartData: userData.slice(-10).map(item => ({ value: item.activeUsers })), chartColor: '#3b82f6' },
      { id: 'user-new', title: 'New Users', value: this.formatNumber(totalNewUsers), change: 12.3, isPositive: true, chartData: userData.slice(-10).map(item => ({ value: item.newUsers })), chartColor: '#10b981' },
      { id: 'user-sessions', title: 'Sessions', value: this.formatNumber(Math.floor(totalActiveUsers * 1.3)), change: 8.7, isPositive: true, chartData: userData.slice(-8).map(item => ({ value: item.activeUsers * 1.3 + Math.random() * 100 })), chartColor: '#f59e0b' },
      { id: 'user-bounce', title: 'Bounce Rate', value: '32.4%', change: -5.2, isPositive: false, chartData: userData.slice(-6).map(() => ({ value: 25 + Math.random() * 15 })), chartColor: '#ef4444' }
    ];

    // Create charts after view updates
    setTimeout(() => {
      this.createTopMetricsCharts();
      this.createSalesCharts(salesData, avgSales);
      this.createUserCharts(userData);
      this.createCustomerCharts();
    }, 100);
  }

  private createTopMetricsCharts(): void {
    this.topMetricsData.forEach((metric, index) => {
      setTimeout(() => {
        this.createMiniChart('chart-' + metric.id, metric.chartData, metric.chartColor, 'area');
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

  private createMiniChart(canvasId: string, data: any[], color: string, type = 'line'): void {
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
    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data: data.map(d => d.value),
          borderColor: color,
          backgroundColor: type === 'area' ? gradient : 'transparent',
          borderWidth: 2,
          fill: type === 'area',
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointStyle: 'point',
        }]
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
            }
          },
          tooltip: {
            usePointStyle: true,
            enabled: false
          }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        elements: { point: { radius: 0 } },
        interaction: { intersect: false },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
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

  updateRevenueTargetChart() {
    const salesData = this.generateSalesData(this.currentTimeFrame);
    const avgSales = salesData.length > 0 ? salesData.reduce((sum: number, item: any) => sum + item.sales, 0) / salesData.length : 0;
    const revenueTargetData = salesData.map((item: any) => ({
      ...item,
      revenue: item.sales * 0.72,
      target: avgSales * 0.85
    }));
    let dataKeys: string[] = [];
    let colors: string[] = [];
    if (this.showRevenue) {
      dataKeys.push('revenue');
      colors.push('#3b82f6');
    }
    if (this.showTarget) {
      dataKeys.push('target');
      colors.push('#94a3b8');
    }
    this.createEnhancedChart('revenueTargetChart', revenueTargetData, dataKeys, colors, 'line');
  }

  updateSalesTrendChart() {
    const salesData = this.generateSalesData(this.currentTimeFrame);
    const dataKeys = [];
    const colors = [];
    if (this.showSales) {
      dataKeys.push('sales');
      colors.push('#10b981');
    }
    this.createEnhancedChart('salesTrendChart', salesData, dataKeys, colors, 'area');
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
}