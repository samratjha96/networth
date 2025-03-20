/**
 * Simplified chart rendering utility for demonstration purposes
 */
class SimpleChart {
  constructor(canvasId, data, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.data = data;
    this.options = Object.assign({
      lineColor: '#3B82F6',
      fillColor: 'rgba(59, 130, 246, 0.1)',
      pointRadius: 0,
      showGrid: true,
      gridColor: 'rgba(255, 255, 255, 0.05)',
      padding: 20,
      tension: 0.4,
      animate: true
    }, options);
    
    this.init();
  }
  
  init() {
    // Set canvas dimensions based on container
    this.setDimensions();
    window.addEventListener('resize', () => this.setDimensions());
    
    if (this.options.animate) {
      this.animationProgress = 0;
      this.animate();
    } else {
      this.draw(1);
    }
  }
  
  setDimensions() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    
    if (!this.options.animate) {
      this.draw(1);
    }
  }
  
  animate() {
    this.animationProgress += 0.02;
    this.draw(Math.min(this.animationProgress, 1));
    
    if (this.animationProgress < 1) {
      requestAnimationFrame(() => this.animate());
    }
  }
  
  draw(progress) {
    const { ctx, canvas, data, options } = this;
    const { width, height } = canvas;
    const padding = options.padding;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (data.length === 0) return;
    
    // Find min and max values
    const values = data.map(point => point.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const valueRange = maxValue - minValue || 1;
    
    // Draw grid if enabled
    if (options.showGrid) {
      this.drawGrid();
    }
    
    // Calculate points
    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const normalizedValue = (point.value - minValue) / valueRange;
      const y = height - padding - normalizedValue * (height - padding * 2);
      return { x, y, ...point };
    });
    
    // Draw filled area
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);
    
    points.slice(0, Math.ceil(points.length * progress)).forEach((point, i) => {
      if (i === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const prev = points[i - 1];
        const cp1x = prev.x + (point.x - prev.x) * options.tension;
        const cp1y = prev.y;
        const cp2x = point.x - (point.x - prev.x) * options.tension;
        const cp2y = point.y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
      }
    });
    
    const lastPoint = points[Math.min(Math.ceil(points.length * progress) - 1, points.length - 1)];
    ctx.lineTo(lastPoint.x, height - padding);
    ctx.closePath();
    
    ctx.fillStyle = options.fillColor;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    points.slice(0, Math.ceil(points.length * progress)).forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        const prev = points[i - 1];
        const cp1x = prev.x + (point.x - prev.x) * options.tension;
        const cp1y = prev.y;
        const cp2x = point.x - (point.x - prev.x) * options.tension;
        const cp2y = point.y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, point.x, point.y);
      }
    });
    
    ctx.strokeStyle = options.lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw points if needed
    if (options.pointRadius > 0) {
      points.slice(0, Math.ceil(points.length * progress)).forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, options.pointRadius, 0, Math.PI * 2);
        ctx.fillStyle = options.lineColor;
        ctx.fill();
      });
    }
  }
  
  drawGrid() {
    const { ctx, canvas, options } = this;
    const { width, height } = canvas;
    const padding = options.padding;
    
    ctx.beginPath();
    
    // Horizontal grid lines - 5 lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + i * ((height - padding * 2) / 5);
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
    }
    
    // Vertical grid lines - based on data points
    const numVertical = Math.min(12, this.data.length);
    for (let i = 0; i <= numVertical; i++) {
      const x = padding + i * ((width - padding * 2) / numVertical);
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
    }
    
    ctx.strokeStyle = options.gridColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  updateData(newData) {
    this.data = newData;
    if (this.options.animate) {
      this.animationProgress = 0;
      this.animate();
    } else {
      this.draw(1);
    }
  }
}

/**
 * Generate sample chart data
 */
function generateChartData(count = 50, options = {}) {
  const { min = -130000, max = -90000, volatility = 2000, trend = 0 } = options;
  
  const data = [];
  let value = Math.floor(Math.random() * (max - min) + min);
  
  for (let i = 0; i < count; i++) {
    // Random walk with trend
    value += (Math.random() - 0.5) * volatility + trend;
    // Ensure within bounds
    value = Math.max(min, Math.min(max, value));
    
    data.push({
      value,
      label: `Day ${i+1}`
    });
  }
  
  return data;
}

/**
 * Format currency
 */
function formatCurrency(amount, options = {}) {
  const { currency = 'USD', maximumFractionDigits = 2 } = options;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits
  }).format(amount);
}

/**
 * Format percentage
 */
function formatPercentage(value, options = {}) {
  const { maximumFractionDigits = 2 } = options;
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits
  }).format(value/100);
}

/**
 * Theme toggle functionality
 */
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      
      // Update charts if needed
      const charts = window.charts || [];
      charts.forEach(chart => chart.draw(1));
    });
  }
} 