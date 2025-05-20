/**
 * 简化版力导向布局算法实现
 * 用于模拟节点间的物理力并计算最终布局
 */
class ForceSimulation {
  constructor(nodes, links, options = {}) {
    // 节点和连接
    this.nodes = nodes;
    this.links = links;
    
    // 配置参数
    this.options = Object.assign({
      // 引力强度（连接的节点相互吸引）
      linkStrength: 0.05,
      // 斥力强度（所有节点相互排斥）
      repulsionStrength: 500,
      // 中心引力强度（所有节点向中心靠拢）
      centerStrength: 0.0001,
      // 摩擦系数（用于减慢节点运动）
      friction: 0.95,
      // 最小节点距离（防止节点重叠）
      minDistance: 70,
      // 引力作用范围
      linkDistance: 120
    }, options);
    
    // 画布尺寸
    this.width = 0;
    this.height = 0;
    
    // 是否正在模拟
    this.running = false;
  }
  
  /**
   * 设置画布尺寸
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
    return this;
  }
  
  /**
   * 开始模拟
   */
  start() {
    this.running = true;
    return this;
  }
  
  /**
   * 停止模拟
   */
  stop() {
    this.running = false;
    return this;
  }
  
  /**
   * 计算单次迭代的节点位置
   */
  tick() {
    if (!this.running) return this;
    
    // 1. 应用节点间斥力
    this.applyRepulsionForces();
    
    // 2. 应用连接间引力
    this.applyLinkForces();
    
    // 3. 应用中心引力
    this.applyCenterForces();
    
    // 4. 更新节点位置
    this.updatePositions();
    
    return this;
  }
  
  /**
   * 应用节点间斥力（相互排斥）
   * 使用平方反比排斥力，模拟带电粒子
   */
  applyRepulsionForces() {
    const { nodes, options } = this;
    const { repulsionStrength, minDistance } = options;
    
    // 对每对节点计算排斥力
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        
        // 计算两节点间距离
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // 如果距离太近，施加排斥力
        if (distance < minDistance * 2) {
          const force = repulsionStrength / (distance * distance);
          const forceX = dx / distance * force;
          const forceY = dy / distance * force;
          
          // 施加相等大小、相反方向的力
          nodeA.vx -= forceX;
          nodeA.vy -= forceY;
          nodeB.vx += forceX;
          nodeB.vy += forceY;
        }
      }
    }
  }
  
  /**
   * 应用连接间引力（连接的节点相互吸引）
   * 使用弹簧模型，模拟弹簧拉力
   */
  applyLinkForces() {
    const { nodes, links, options } = this;
    const { linkStrength, linkDistance } = options;
    
    // 对每个连接施加弹簧力
    links.forEach(link => {
      // 通过ID查找对应的节点
      const sourceNode = nodes.find(node => node.id === link.source);
      const targetNode = nodes.find(node => node.id === link.target);
      
      if (sourceNode && targetNode) {
        // 计算两节点间距离
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // 施加引力（距离越远拉力越大）
        if (distance > linkDistance) {
          const force = (distance - linkDistance) * linkStrength;
          const forceX = dx / distance * force;
          const forceY = dy / distance * force;
          
          // 施加相等大小、相反方向的力
          sourceNode.vx += forceX;
          sourceNode.vy += forceY;
          targetNode.vx -= forceX;
          targetNode.vy -= forceY;
        }
      }
    });
  }
  
  /**
   * 应用中心引力（所有节点向中心靠拢）
   */
  applyCenterForces() {
    const { nodes, width, height, options } = this;
    const { centerStrength } = options;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 对每个节点施加指向中心的力
    nodes.forEach(node => {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      // 力与距离成正比
      node.vx += dx * centerStrength;
      node.vy += dy * centerStrength;
    });
  }
  
  /**
   * 更新节点位置
   */
  updatePositions() {
    const { nodes, width, height, options } = this;
    const { friction } = options;
    
    // 更新每个节点位置
    nodes.forEach(node => {
      // 应用速度衰减（摩擦力）
      node.vx *= friction;
      node.vy *= friction;
      
      // 根据速度更新位置
      node.x += node.vx;
      node.y += node.vy;
      
      // 边界碰撞检测
      const radius = node.radius || 30;
      
      if (node.x < radius) {
        node.x = radius;
        node.vx = -node.vx * 0.5; // 碰撞反弹
      }
      
      if (node.x > width - radius) {
        node.x = width - radius;
        node.vx = -node.vx * 0.5;
      }
      
      if (node.y < radius) {
        node.y = radius;
        node.vy = -node.vy * 0.5;
      }
      
      if (node.y > height - radius) {
        node.y = height - radius;
        node.vy = -node.vy * 0.5;
      }
    });
  }
}

// 导出工具类
window.ForceSimulation = ForceSimulation; 