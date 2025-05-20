/**
 * 人物关系图组件
 * 负责在Canvas上绘制角色关系网络图
 */
class RelationshipGraph {
  /**
   * 构造函数
   * @param {HTMLElement} container - 图谱容器DOM元素
   * @param {Object} data - 角色和关系数据
   * @param {Object} options - 配置选项
   */
  constructor(container, data, options = {}) {
    this.container = container;
    this.data = data;
    
    // 配置选项
    this.options = {
      // 初始加载的最大角色数量
      initialCharactersLimit: options.initialCharactersLimit || 15,
      // 是否启用渐进式加载
      progressiveLoading: options.progressiveLoading !== false
    };
    
    // 初始化画布
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    // 获取容器尺寸
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    // 添加高DPI支持
    this.setupHiDPI();
    
    // 节点数据
    this.nodes = [];
    this.selectedNode = null;
    
    // 事件回调
    this.onSelectCallback = null;
    
    // 鼠标状态
    this.isDragging = false;
    this.draggedNode = null;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    // 是否启用物理模拟
    this.simulationEnabled = true;
    
    // 最小节点间距
    this.minNodeDistance = 80; // 节点间最小距离
    
    // 全选模式
    this.selectAllMode = false;
    
    // 关系类型颜色映射
    this.relationColors = {
      'connected': 'rgba(200, 200, 200, 0.5)',
      'master_disciple': 'rgba(255, 165, 0, 0.5)',
      'family': 'rgba(255, 105, 180, 0.5)',
      'friend': 'rgba(50, 205, 50, 0.5)',
      'fiance': 'rgba(147, 112, 219, 0.5)',
      'same_race': 'rgba(64, 224, 208, 0.5)'
    };
    
    // 关系类型文字映射
    this.relationLabels = {
      'connected': '相识',
      'master_disciple': '师徒',
      'family': '亲属',
      'friend': '朋友',
      'fiance': '婚约',
      'same_race': '同族'
    };
    
    // 角色头像缓存
    this.avatarCache = {};
    
    // 已加载的角色集合
    this.loadedCharacters = new Set();
    
    // 创建全选按钮
    this.createSelectAllButton();
    
    // 创建搜索框
    this.createSearchBox();
    
    // 如果启用渐进式加载，创建加载更多按钮
    if (this.options.progressiveLoading) {
      this.createLoadMoreButton();
    }
    
    // 初始化
    this.initializeNodes();
    this.setupEventListeners();
    this.initializeSimulation();
    this.startAnimation();
    
    // 加载头像（只加载已初始化的节点）
    this.loadAvatarsForNodes();
  }
  
  /**
   * 设置高DPI支持
   */
  setupHiDPI() {
    // 获取设备像素比
    const dpr = window.devicePixelRatio || 1;
    
    // 设置Canvas的物理像素大小
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    
    // 设置Canvas的显示大小
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    
    // 缩放上下文以匹配设备像素比
    this.ctx.scale(dpr, dpr);
    
    // 保存设备像素比
    this.dpr = dpr;
  }
  
  /**
   * 创建全选按钮
   */
  createSelectAllButton() {
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'select-all-container';
    buttonContainer.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 100;
    `;
    
    // 创建全选按钮
    this.selectAllButton = document.createElement('button');
    this.selectAllButton.className = 'select-all-button';
    this.selectAllButton.textContent = '全选移动';
    this.selectAllButton.style.cssText = `
      padding: 10px 15px;
      background-color: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    `;
    
    // 按钮悬浮效果
    this.selectAllButton.addEventListener('mouseover', () => {
      this.selectAllButton.style.backgroundColor = 'rgba(76, 139, 245, 0.5)';
    });
    
    this.selectAllButton.addEventListener('mouseout', () => {
      if (!this.selectAllMode) {
        this.selectAllButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      }
    });
    
    // 全选按钮点击事件
    this.selectAllButton.addEventListener('click', () => {
      this.toggleSelectAllMode();
    });
    
    // 添加按钮到容器
    buttonContainer.appendChild(this.selectAllButton);
    this.container.appendChild(buttonContainer);
  }
  
  /**
   * 切换全选模式
   */
  toggleSelectAllMode() {
    this.selectAllMode = !this.selectAllMode;
    
    if (this.selectAllMode) {
      // 启用全选模式
      this.selectAllButton.style.backgroundColor = 'rgba(76, 139, 245, 0.7)';
      this.selectAllButton.textContent = '取消全选';
      
      // 取消当前选中的节点
      this.selectedNode = null;
      
      // 提示用户
      this.showMessage('全选模式已启用，点击并拖动可移动整个图谱');
    } else {
      // 禁用全选模式
      this.selectAllButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      this.selectAllButton.textContent = '全选移动';
      
      // 提示用户
      this.showMessage('全选模式已关闭');
    }
  }
  
  /**
   * 显示消息
   * @param {string} text - 消息文本
   */
  showMessage(text) {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = 'graph-message';
    messageElement.textContent = text;
    messageElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000;
      transition: opacity 0.3s;
    `;
    
    document.body.appendChild(messageElement);
    
    // 2秒后移除消息
    setTimeout(() => {
      messageElement.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(messageElement);
      }, 300);
    }, 2000);
  }
  
  /**
   * 初始化节点数据
   */
  initializeNodes() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.35;
    
    // 确定要加载的初始角色
    let initialCharacters = this.determineInitialCharacters();
    
    // 创建节点数据，设置初始位置
    initialCharacters.forEach((character, index) => {
      // 围绕中心点均匀分布
      const angle = (index / initialCharacters.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // 确定节点半径 - 主角萧炎使用更大的半径
      const isProtagonist = character.id === 'xiao_yan';
      const nodeRadius = isProtagonist ? 40 : 30;
      
      // 添加到节点列表
      this.nodes.push({
        id: character.id,
        name: character.name,
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: nodeRadius,
        isProtagonist: isProtagonist,
        fixed: false, // 初始不固定，让力导向算法生效
        data: character
      });
      
      // 标记为已加载
      this.loadedCharacters.add(character.id);
    });
    
    // 更新加载更多按钮状态
    this.updateLoadMoreButtonVisibility();
  }
  
  /**
   * 确定初始加载的角色
   * @returns {Array} 初始角色列表
   */
  determineInitialCharacters() {
    // 如果禁用渐进式加载，返回所有角色
    if (!this.options.progressiveLoading) {
      return [...this.data.characters];
    }
    
    const sortedCharacters = [...this.data.characters];
    
    // 找出主角（萧炎）
    const protagonistIndex = sortedCharacters.findIndex(c => c.id === 'xiao_yan');
    
    // 如果找到主角，将其放在第一位
    if (protagonistIndex >= 0) {
      const protagonist = sortedCharacters.splice(protagonistIndex, 1)[0];
      sortedCharacters.unshift(protagonist);
    }
    
    // 计算每个角色的关系数量
    const characterRelationCount = {};
    this.data.characters.forEach(char => {
      characterRelationCount[char.id] = 0;
    });
    
    this.data.relationships.forEach(rel => {
      characterRelationCount[rel.source] = (characterRelationCount[rel.source] || 0) + 1;
      characterRelationCount[rel.target] = (characterRelationCount[rel.target] || 0) + 1;
    });
    
    // 根据关系数量排序（与主角先不考虑）
    sortedCharacters.slice(1).sort((a, b) => {
      return characterRelationCount[b.id] - characterRelationCount[a.id];
    });
    
    // 限制初始加载数量
    return sortedCharacters.slice(0, this.options.initialCharactersLimit);
  }
  
  /**
   * 调整节点位置，避免重叠
   */
  adjustNodePositions() {
    // 最大迭代次数
    const maxIterations = 30;
    
    // 进行多次迭代以解决重叠
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let overlapping = false;
      
      // 遍历所有节点对
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const nodeA = this.nodes[i];
          const nodeB = this.nodes[j];
          
          // 计算节点之间的距离
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 计算两节点最小安全距离
          const minSafeDistance = nodeA.radius + nodeB.radius + this.minNodeDistance;
          
          // 如果距离小于最小安全距离，调整位置
          if (distance < minSafeDistance) {
            overlapping = true;
            
            // 计算需要移动的距离
            const moveFactor = (minSafeDistance - distance) / distance * 0.5;
            
            // 创建移动向量
            const moveX = dx * moveFactor;
            const moveY = dy * moveFactor;
            
            // 移动节点（两个节点朝相反方向移动）
            nodeA.x -= moveX;
            nodeA.y -= moveY;
            nodeB.x += moveX;
            nodeB.y += moveY;
            
            // 确保节点不会移出画布
            this.keepNodeInBounds(nodeA);
            this.keepNodeInBounds(nodeB);
          }
        }
      }
      
      // 如果没有重叠，提前结束迭代
      if (!overlapping) {
        break;
      }
    }
  }
  
  /**
   * 确保节点在画布范围内
   * @param {Object} node - 要检查的节点
   */
  keepNodeInBounds(node) {
    const padding = 20; // 边界内边距
    
    // 处理x方向
    if (node.x < node.radius + padding) {
      node.x = node.radius + padding;
    } else if (node.x > this.width - node.radius - padding) {
      node.x = this.width - node.radius - padding;
    }
    
    // 处理y方向
    if (node.y < node.radius + padding) {
      node.y = node.radius + padding;
    } else if (node.y > this.height - node.radius - padding) {
      node.y = this.height - node.radius - padding;
    }
  }
  
  /**
   * 固定所有节点
   */
  fixAllNodes() {
    // 先调整节点位置，解决重叠问题
    this.adjustNodePositions();
    
    // 然后固定所有节点
    this.nodes.forEach(node => {
      node.fixed = true;
      node.vx = 0;
      node.vy = 0;
    });
    
    console.log('所有节点已调整布局并固定');
  }
  
  /**
   * 解除所有节点固定
   */
  unfixAllNodes() {
    this.nodes.forEach(node => {
      node.fixed = false;
    });
    console.log('所有节点已解除固定');
  }
  
  /**
   * 移动所有节点
   * @param {number} dx - X方向位移
   * @param {number} dy - Y方向位移
   */
  moveAllNodes(dx, dy) {
    // 保存原始位置
    const originalPositions = this.nodes.map(node => ({ 
      id: node.id, 
      x: node.x, 
      y: node.y 
    }));
    
    // 尝试移动所有节点
    this.nodes.forEach(node => {
      node.x += dx;
      node.y += dy;
    });
    
    // 检查是否有节点超出边界
    let outOfBounds = false;
    this.nodes.forEach(node => {
      if (node.x < node.radius + 20 || 
          node.x > this.width - node.radius - 20 ||
          node.y < node.radius + 20 || 
          node.y > this.height - node.radius - 20) {
        outOfBounds = true;
      }
    });
    
    // 如果有节点超出边界，恢复原始位置
    if (outOfBounds) {
      this.nodes.forEach(node => {
        const original = originalPositions.find(p => p.id === node.id);
        if (original) {
          node.x = original.x;
          node.y = original.y;
        }
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * 初始化力导向模拟
   */
  initializeSimulation() {
    // 从角色关系数据中提取连接（只考虑已加载的角色）
    const links = this.data.relationships
      .filter(rel => 
        this.loadedCharacters.has(rel.source) && 
        this.loadedCharacters.has(rel.target)
      )
      .map(rel => ({
      source: rel.source,
      target: rel.target,
      type: rel.type
    }));
    
    // 创建力导向布局实例
    this.simulation = new ForceSimulation(this.nodes, links, {
      linkStrength: 0.05,
      repulsionStrength: 800,
      centerStrength: 0.0001,
      friction: 0.95,
      minDistance: 70,
      linkDistance: 150
    });
    
    // 设置画布尺寸并启动
    this.simulation.setSize(this.width, this.height).start();
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 鼠标按下事件
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    
    // 鼠标移动事件
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // 鼠标松开事件
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // 窗口大小变化事件
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // 触摸事件（移动设备支持）
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // 双击事件 - 解除节点固定
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    
    // 键盘事件 - ESC键退出全选模式
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.selectAllMode) {
        this.toggleSelectAllMode();
      }
    });
  }
  
  /**
   * 启动动画循环
   */
  startAnimation() {
    const animate = () => {
      // 清空画布
      this.ctx.clearRect(0, 0, this.width, this.height);
      
      // 如果没有拖动且模拟启用，执行力导向计算
      if (!this.isDragging && this.simulationEnabled) {
        // 保存固定节点的位置
        const fixedPositions = {};
        this.nodes.forEach(node => {
          if (node.fixed) {
            fixedPositions[node.id] = { x: node.x, y: node.y };
          }
        });
        
        // 执行力导向计算
        this.simulation.tick();
        
        // 恢复固定节点的位置
        this.nodes.forEach(node => {
          if (node.fixed && fixedPositions[node.id]) {
            node.x = fixedPositions[node.id].x;
            node.y = fixedPositions[node.id].y;
            node.vx = 0;
            node.vy = 0;
          }
        });
      }
      
      // 先绘制连接线
      this.drawLinks();
      
      // 再绘制节点
      this.drawNodes();
      
      // 绘制全选模式指示器
      if (this.selectAllMode) {
        this.drawSelectAllIndicator();
      }
      
      // 继续下一帧
      requestAnimationFrame(animate);
    };
    
    // 启动动画
    animate();
  }
  
  /**
   * 绘制全选模式指示器
   */
  drawSelectAllIndicator() {
    const { ctx } = this;
    
    // 绘制半透明边框
    ctx.strokeStyle = 'rgba(76, 139, 245, 0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(10, 10, this.width - 20, this.height - 20);
    ctx.setLineDash([]);
    
    // 绘制提示文本
    ctx.font = 'bold 16px Microsoft YaHei';
    ctx.fillStyle = 'rgba(76, 139, 245, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('全选模式：点击并拖动可移动整个图谱', this.width / 2, 20);
  }
  
  /**
   * 绘制节点之间的连接线
   */
  drawLinks() {
    const { ctx, nodes } = this;
    
    // 默认连线样式
    ctx.lineWidth = 1;
    
    // 只绘制已加载节点之间的关系
    this.data.relationships.forEach(rel => {
      // 确保两端节点都已加载
      if (!this.loadedCharacters.has(rel.source) || !this.loadedCharacters.has(rel.target)) {
        return;
      }
      
      const sourceNode = nodes.find(n => n.id === rel.source);
      const targetNode = nodes.find(n => n.id === rel.target);
      
      if (sourceNode && targetNode) {
        // 获取关系类型颜色
        const relationColor = this.relationColors[rel.type] || 'rgba(255, 255, 255, 0.2)';
        
        // 如果有选中节点，高亮相关连线
        if (this.selectedNode) {
          if (this.selectedNode.id === sourceNode.id || this.selectedNode.id === targetNode.id) {
            ctx.strokeStyle = relationColor;
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 0.5;
          }
        } else {
          ctx.strokeStyle = relationColor;
        }
        
        // 绘制直线
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();
        
        // 绘制关系标签
        if (this.selectedNode && (this.selectedNode.id === sourceNode.id || this.selectedNode.id === targetNode.id)) {
          const relationLabel = this.relationLabels[rel.type] || rel.type;
          
          // 计算标签位置（线段中点）
          const labelX = (sourceNode.x + targetNode.x) / 2;
          const labelY = (sourceNode.y + targetNode.y) / 2;
          
          // 绘制标签背景
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.beginPath();
          ctx.ellipse(labelX, labelY, ctx.measureText(relationLabel).width / 2 + 8, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // 绘制标签文字
          ctx.font = '10px Microsoft YaHei';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(relationLabel, labelX, labelY);
        }
      }
    });
    
    // 重置默认样式
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
  }
  
  /**
   * 显示调整过程的提示信息
   */
  showAdjustmentMessage() {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = 'adjustment-message';
    messageElement.textContent = '优化节点布局中...';
    messageElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000;
      transition: opacity 0.3s;
    `;
    
    document.body.appendChild(messageElement);
    
    // 1秒后移除消息
    setTimeout(() => {
      messageElement.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(messageElement);
      }, 300);
    }, 1000);
  }
  
  /**
   * 绘制所有角色节点
   */
  drawNodes() {
    const { ctx, nodes } = this;
    
    // 绘制每个节点
    nodes.forEach(node => {
      // 计算阴影大小
      const shadowSize = this.selectedNode && this.selectedNode.id === node.id ? 15 : 5;
      
      // 绘制节点背景
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      
      // 如果是主角，使用特殊样式
      if (node.isProtagonist) {
        // 主角样式 - 红色边框
        if (this.selectedNode && this.selectedNode.id === node.id) {
          ctx.fillStyle = 'rgba(255, 140, 0, 0.8)';
          ctx.shadowColor = 'rgba(255, 140, 0, 0.5)';
        } else {
          ctx.fillStyle = 'rgba(255, 69, 0, 0.5)';
          ctx.shadowColor = 'rgba(255, 69, 0, 0.3)';
        }
      } 
      // 如果是选中的节点，使用高亮样式
      else if (this.selectedNode && this.selectedNode.id === node.id) {
        ctx.fillStyle = 'rgba(76, 139, 245, 0.8)';
        ctx.shadowColor = 'rgba(76, 139, 245, 0.5)';
      } 
      // 在全选模式下，所有节点使用轻微高亮样式
      else if (this.selectAllMode) {
        ctx.fillStyle = 'rgba(76, 139, 245, 0.3)';
        ctx.shadowColor = 'rgba(76, 139, 245, 0.1)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
      }
      
      ctx.shadowBlur = shadowSize;
      ctx.fill();
      
      // 绘制头像（如果已加载）
      const avatar = this.avatarCache[node.id];
      if (avatar) {
        ctx.save();
        
        // 创建圆形裁剪区域
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius - 4, 0, Math.PI * 2);
        ctx.clip();
        
        // 绘制头像
        const avatarSize = node.radius * 2 - 8;
        ctx.drawImage(
          avatar, 
          node.x - avatarSize / 2, 
          node.y - avatarSize / 2, 
          avatarSize, 
          avatarSize
        );
        
        ctx.restore();
      }
      
      // 如果所有节点都是固定的，不再显示固定标记
      const allFixed = this.nodes.every(n => n.fixed);
      
      // 只有当不是所有节点都固定时才显示固定标记
      if (node.fixed && !allFixed) {
        // 绘制固定标记 - 小圆点
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(node.x, node.y - node.radius - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 为主角添加特殊标识
      if (node.isProtagonist) {
        // 绘制星形标记
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'gold';
        this.drawStar(ctx, node.x, node.y - node.radius - 10, 5, 5, 10);
      }
      
      // 重置阴影
      ctx.shadowBlur = 0;
      
      // 绘制名称
      ctx.font = node.isProtagonist ? 'bold 14px Microsoft YaHei' : 'bold 12px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      
      // 添加文字阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // 将名称绘制在节点中间
      ctx.fillText(node.name, node.x, node.y + node.radius + 15);
      
      // 重置阴影
      ctx.shadowBlur = 0;
    });
  }
  
  /**
   * 绘制星形
   */
  drawStar(ctx, cx, cy, spikes, innerRadius, outerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * 鼠标按下事件处理
   */
  handleMouseDown(e) {
    e.preventDefault(); // 阻止默认行为
    
    const mouseX = e.clientX - this.canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - this.canvas.getBoundingClientRect().top;
    
    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;
    
    // 如果是全选模式，直接开始拖动
    if (this.selectAllMode) {
      this.isDragging = true;
      this.selectedNode = null;
      return;
    }
    
    // 检测点击了哪个节点
    const clickedNode = this.findNodeAtPosition(mouseX, mouseY);
    
    if (clickedNode) {
      // 点击到节点，准备拖动
      this.isDragging = true;
      this.draggedNode = clickedNode;
      
      // 点击选中节点
      this.selectNode(clickedNode);
    }
  }
  
  /**
   * 鼠标移动事件处理
   */
  handleMouseMove(e) {
    e.preventDefault(); // 阻止默认行为
    
    if (!this.isDragging) return;
    
    const mouseX = e.clientX - this.canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - this.canvas.getBoundingClientRect().top;
    
    // 计算移动距离
    const dx = mouseX - this.lastMouseX;
    const dy = mouseY - this.lastMouseY;
    
    if (this.selectAllMode) {
      // 全选模式：移动所有节点
      this.moveAllNodes(dx, dy);
    } else if (this.draggedNode) {
      // 单节点模式：只移动拖动的节点
      this.draggedNode.x += dx;
      this.draggedNode.y += dy;
      
      // 确保节点不会移出画布
      this.keepNodeInBounds(this.draggedNode);
      
      // 清除速度（防止拖动时节点飘走）
      this.draggedNode.vx = 0;
      this.draggedNode.vy = 0;
    }
    
    // 更新鼠标位置
    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;
  }
  
  /**
   * 鼠标松开事件处理
   */
  handleMouseUp(e) {
    e.preventDefault(); // 阻止默认行为
    
    // 拖动结束后固定所有节点位置
    if (this.isDragging) {
      // 显示优化布局的提示信息
      this.showAdjustmentMessage();
      
      // 固定所有节点（会自动处理重叠）
      this.fixAllNodes();
    }
    
    this.isDragging = false;
    this.draggedNode = null;
  }
  
  /**
   * 处理双击事件 - 解除节点固定
   */
  handleDoubleClick(e) {
    e.preventDefault();
    
    // 如果在全选模式下，忽略双击
    if (this.selectAllMode) return;
    
    const mouseX = e.clientX - this.canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - this.canvas.getBoundingClientRect().top;
    
    // 检测双击了哪个节点
    const clickedNode = this.findNodeAtPosition(mouseX, mouseY);
    
    if (clickedNode) {
      // 解除所有节点固定状态
      this.unfixAllNodes();
    }
  }
  
  /**
   * 处理浏览器窗口大小变化
   */
  handleResize() {
    // 更新画布尺寸
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    // 重新设置高DPI支持
    this.setupHiDPI();
    
    // 更新模拟器尺寸
    if (this.simulation) {
      this.simulation.setSize(this.width, this.height);
    }
  }
  
  /**
   * 触摸开始事件处理
   */
  handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const touchX = touch.clientX - this.canvas.getBoundingClientRect().left;
      const touchY = touch.clientY - this.canvas.getBoundingClientRect().top;
      
      this.lastMouseX = touchX;
      this.lastMouseY = touchY;
      
      // 如果是全选模式，直接开始拖动
      if (this.selectAllMode) {
        this.isDragging = true;
        this.selectedNode = null;
        return;
      }
      
      // 检测触摸了哪个节点
      const touchedNode = this.findNodeAtPosition(touchX, touchY);
      
      if (touchedNode) {
        // 触摸到节点，准备拖动
        this.isDragging = true;
        this.draggedNode = touchedNode;
        
        // 触摸选中节点
        this.selectNode(touchedNode);
      }
    }
  }
  
  /**
   * 触摸移动事件处理
   */
  handleTouchMove(e) {
    e.preventDefault();
    if (!this.isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const touchX = touch.clientX - this.canvas.getBoundingClientRect().left;
    const touchY = touch.clientY - this.canvas.getBoundingClientRect().top;
    
    // 计算移动距离
    const dx = touchX - this.lastMouseX;
    const dy = touchY - this.lastMouseY;
    
    if (this.selectAllMode) {
      // 全选模式：移动所有节点
      this.moveAllNodes(dx, dy);
    } else if (this.draggedNode) {
      // 单节点模式：只移动拖动的节点
      this.draggedNode.x += dx;
      this.draggedNode.y += dy;
      
      // 确保节点不会移出画布
      this.keepNodeInBounds(this.draggedNode);
      
      // 清除速度
      this.draggedNode.vx = 0;
      this.draggedNode.vy = 0;
    }
    
    // 更新触摸位置
    this.lastMouseX = touchX;
    this.lastMouseY = touchY;
  }
  
  /**
   * 触摸结束事件处理
   */
  handleTouchEnd(e) {
    e.preventDefault();
    
    // 拖动结束后固定所有节点位置
    if (this.isDragging) {
      // 显示优化布局的提示信息
      this.showAdjustmentMessage();
      
      // 固定所有节点（会自动处理重叠）
      this.fixAllNodes();
    }
    
    this.isDragging = false;
    this.draggedNode = null;
  }
  
  /**
   * 查找指定位置的节点
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Object|null} 找到的节点或null
   */
  findNodeAtPosition(x, y) {
    // 从后向前检查（后绘制的节点优先检测，形成正确的层叠顺序）
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const dx = x - node.x;
      const dy = y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= node.radius) {
        return node;
      }
    }
    
    return null;
  }
  
  /**
   * 选中节点
   * @param {Object} node - 要选中的节点
   */
  selectNode(node) {
    this.selectedNode = node;
    
    // 触发选中回调
    if (this.onSelectCallback && node) {
      this.onSelectCallback(node.data);
    }
  }
  
  /**
   * 重置图谱
   */
  reset() {
    // 重新初始化节点位置并解除所有固定状态
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.35;
    
    this.unfixAllNodes(); // 解除所有节点固定
    
    // 关闭全选模式（如果开启）
    if (this.selectAllMode) {
      this.toggleSelectAllMode();
    }
    
    this.nodes.forEach((node, index) => {
      const angle = (index / this.nodes.length) * Math.PI * 2;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
      node.vx = 0;
      node.vy = 0;
    });
  }
  
  /**
   * 设置选中节点的回调函数
   * @param {Function} callback - 选中节点时的回调
   */
  setOnSelectCallback(callback) {
    this.onSelectCallback = callback;
  }
  
  /**
   * 通过ID查找节点并选中
   * @param {string} nodeId - 要选中的节点ID
   */
  selectNodeById(nodeId) {
    // 如果节点未加载，先尝试加载
    if (!this.loadedCharacters.has(nodeId)) {
      const character = this.data.characters.find(c => c.id === nodeId);
      if (character) {
        this.showMessage(`正在加载角色: ${character.name}`);
        this.addCharacterNode(character);
        this.loadAvatarsForNodes();
      }
    }
    
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      this.selectNode(node);
      
      // 找到该节点后将视图中心移动到该节点位置
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      
      // 移动所有节点，使选中的节点位于中心
      this.moveAllNodes(dx, dy);
      
      return true;
    }
    return false;
  }
  
  /**
   * 创建角色搜索框
   */
  createSearchBox() {
    // 创建搜索容器
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 100;
      display: flex;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      padding: 5px 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;
    
    // 创建搜索输入框
    this.searchInput = document.createElement('input');
    this.searchInput.className = 'search-input';
    this.searchInput.placeholder = '搜索角色...';
    this.searchInput.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 8px 12px;
      margin-right: 8px;
      border-radius: 4px;
      font-size: 14px;
      width: 150px;
      outline: none;
    `;
    
    // 输入框聚焦效果
    this.searchInput.addEventListener('focus', () => {
      this.searchInput.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      this.searchInput.style.boxShadow = '0 0 0 2px rgba(76, 139, 245, 0.5)';
    });
    
    this.searchInput.addEventListener('blur', () => {
      this.searchInput.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      this.searchInput.style.boxShadow = 'none';
    });
    
    // 回车键搜索触发
    this.searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.searchCharacter();
      }
    });
    
    // 创建搜索按钮
    const searchButton = document.createElement('button');
    searchButton.className = 'search-button';
    searchButton.textContent = '搜索';
    searchButton.style.cssText = `
      background-color: rgba(76, 139, 245, 0.7);
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    `;
    
    // 按钮悬浮效果
    searchButton.addEventListener('mouseover', () => {
      searchButton.style.backgroundColor = 'rgba(76, 139, 245, 0.9)';
    });
    
    searchButton.addEventListener('mouseout', () => {
      searchButton.style.backgroundColor = 'rgba(76, 139, 245, 0.7)';
    });
    
    // 搜索按钮点击事件
    searchButton.addEventListener('click', () => {
      this.searchCharacter();
    });
    
    // 添加元素到容器
    searchContainer.appendChild(this.searchInput);
    searchContainer.appendChild(searchButton);
    this.container.appendChild(searchContainer);
    
    // 创建搜索结果下拉列表容器
    this.searchResultsContainer = document.createElement('div');
    this.searchResultsContainer.className = 'search-results-container';
    this.searchResultsContainer.style.cssText = `
      position: absolute;
      top: 68px;
      left: 20px;
      z-index: 101;
      background-color: rgba(0, 0, 0, 0.8);
      border-radius: 4px;
      max-height: 300px;
      width: 230px;
      overflow-y: auto;
      display: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    this.container.appendChild(this.searchResultsContainer);
  }
  
  /**
   * 搜索角色
   */
  searchCharacter() {
    const searchTerm = this.searchInput.value.trim();
    
    // 如果搜索词为空，隐藏结果并返回
    if (!searchTerm) {
      this.searchResultsContainer.style.display = 'none';
      return;
    }
    
    // 搜索角色
    const results = this.data.characters.filter(character => {
      // 查找角色ID、名称或描述中包含搜索词
      return character.id.includes(searchTerm) || 
             character.name.includes(searchTerm) ||
             (character.description && character.description.includes(searchTerm));
    });
    
    // 显示搜索结果
    this.displaySearchResults(results);
  }
  
  /**
   * 显示搜索结果
   * @param {Array} results - 搜索结果数组
   */
  displaySearchResults(results) {
    // 清空之前的结果
    this.searchResultsContainer.innerHTML = '';
    
    // 如果没有结果，显示提示信息
    if (results.length === 0) {
      const noResultsMsg = document.createElement('div');
      noResultsMsg.className = 'search-no-results';
      noResultsMsg.textContent = '没有找到匹配的角色';
      noResultsMsg.style.cssText = `
        padding: 10px 15px;
        color: rgba(255, 255, 255, 0.7);
        text-align: center;
        font-size: 14px;
      `;
      
      this.searchResultsContainer.appendChild(noResultsMsg);
      this.searchResultsContainer.style.display = 'block';
      return;
    }
    
    // 创建搜索结果列表
    const resultsList = document.createElement('ul');
    resultsList.style.cssText = `
      list-style: none;
      padding: 0;
      margin: 0;
    `;
    
    // 添加每个搜索结果
    results.forEach(character => {
      const resultItem = document.createElement('li');
      resultItem.style.cssText = `
        padding: 10px 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: background-color 0.2s;
      `;
      
      // 悬浮效果
      resultItem.addEventListener('mouseover', () => {
        resultItem.style.backgroundColor = 'rgba(76, 139, 245, 0.3)';
      });
      
      resultItem.addEventListener('mouseout', () => {
        resultItem.style.backgroundColor = 'transparent';
      });
      
      // 点击结果项
      resultItem.addEventListener('click', () => {
        // 选中对应的节点
        this.selectNodeById(character.id);
        
        // 隐藏搜索结果
        this.searchResultsContainer.style.display = 'none';
        
        // 清空搜索框
        this.searchInput.value = '';
        
        // 显示提示消息
        this.showMessage(`已选中角色: ${character.name}`);
      });
      
      // 结果项内容
      resultItem.innerHTML = `
        <div style="font-weight: bold; color: white;">${character.name}</div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); 
             white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${character.id}
        </div>
      `;
      
      resultsList.appendChild(resultItem);
    });
    
    this.searchResultsContainer.appendChild(resultsList);
    this.searchResultsContainer.style.display = 'block';
  }
  
  /**
   * 创建加载更多按钮
   */
  createLoadMoreButton() {
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'load-more-container';
    buttonContainer.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      display: flex;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 8px 12px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    
    // 创建数量输入框标签
    const inputLabel = document.createElement('span');
    inputLabel.textContent = '加载数量:';
    inputLabel.style.cssText = `
      color: white;
      margin-right: 8px;
      font-size: 14px;
    `;
    
    // 创建数量输入框
    this.loadCountInput = document.createElement('input');
    this.loadCountInput.type = 'number';
    this.loadCountInput.min = '1';
    this.loadCountInput.max = '50';
    this.loadCountInput.value = '10';
    this.loadCountInput.style.cssText = `
      width: 50px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 5px;
      border-radius: 4px;
      margin-right: 10px;
      font-size: 14px;
      text-align: center;
    `;
    
    // 输入框聚焦效果
    this.loadCountInput.addEventListener('focus', () => {
      this.loadCountInput.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      this.loadCountInput.style.boxShadow = '0 0 0 2px rgba(76, 139, 245, 0.5)';
    });
    
    this.loadCountInput.addEventListener('blur', () => {
      this.loadCountInput.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      this.loadCountInput.style.boxShadow = 'none';
      
      // 确保输入值在有效范围内
      let value = parseInt(this.loadCountInput.value, 10);
      if (isNaN(value) || value < 1) {
        this.loadCountInput.value = '1';
      } else if (value > 50) {
        this.loadCountInput.value = '50';
      }
    });
    
    // 创建加载更多按钮
    this.loadMoreButton = document.createElement('button');
    this.loadMoreButton.className = 'load-more-button';
    this.loadMoreButton.textContent = '加载更多角色';
    this.loadMoreButton.style.cssText = `
      background-color: rgba(76, 139, 245, 0.7);
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    `;
    
    // 按钮悬浮效果
    this.loadMoreButton.addEventListener('mouseover', () => {
      this.loadMoreButton.style.backgroundColor = 'rgba(76, 139, 245, 0.9)';
    });
    
    this.loadMoreButton.addEventListener('mouseout', () => {
      this.loadMoreButton.style.backgroundColor = 'rgba(76, 139, 245, 0.7)';
    });
    
    // 加载更多按钮点击事件
    this.loadMoreButton.addEventListener('click', () => {
      this.loadMoreCharacters();
    });
    
    // 回车键触发加载
    this.loadCountInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.loadMoreCharacters();
      }
    });
    
    // 添加元素到容器
    buttonContainer.appendChild(inputLabel);
    buttonContainer.appendChild(this.loadCountInput);
    buttonContainer.appendChild(this.loadMoreButton);
    this.container.appendChild(buttonContainer);
    
    // 如果角色已全部加载，隐藏按钮
    this.updateLoadMoreButtonVisibility();
  }
  
  /**
   * 更新加载更多按钮的可见性
   */
  updateLoadMoreButtonVisibility() {
    if (!this.loadMoreButton) return;
    
    // 如果所有角色都已加载，隐藏按钮
    if (this.loadedCharacters.size >= this.data.characters.length) {
      this.loadMoreButton.style.display = 'none';
    } else {
      this.loadMoreButton.style.display = 'block';
    }
  }
  
  /**
   * 加载更多角色
   */
  loadMoreCharacters() {
    // 获取用户指定的加载数量
    let batchSize = parseInt(this.loadCountInput.value, 10);
    
    // 验证输入
    if (isNaN(batchSize) || batchSize < 1) {
      batchSize = 1;
      this.loadCountInput.value = '1';
    } else if (batchSize > 50) {
      batchSize = 50;
      this.loadCountInput.value = '50';
    }
    
    // 防止重复点击
    this.loadMoreButton.disabled = true;
    this.loadMoreButton.style.opacity = '0.7';
    this.loadMoreButton.textContent = '加载中...';
    this.loadCountInput.disabled = true;
    
    let loadCount = 0;
    
    // 找出未加载的角色
    const unloadedCharacters = this.data.characters.filter(
      char => !this.loadedCharacters.has(char.id)
    );
    
    // 没有更多角色可加载
    if (unloadedCharacters.length === 0) {
      this.showMessage('已加载所有角色');
      this.updateLoadMoreButtonVisibility();
      
      // 恢复按钮状态
      this.loadMoreButton.disabled = false;
      this.loadMoreButton.style.opacity = '1';
      this.loadMoreButton.textContent = '加载更多角色';
      this.loadCountInput.disabled = false;
      
      return;
    }
    
    // 限制加载数量
    const charactersToLoad = unloadedCharacters.slice(0, batchSize);
    
    // 显示加载消息
    this.showMessage(`正在加载 ${charactersToLoad.length} 个新角色...`);
    
    try {
      // 为每个新角色创建节点
      charactersToLoad.forEach(character => {
        this.addCharacterNode(character);
        loadCount++;
      });
      
      // 加载头像
      this.loadAvatarsForNodes();
      
      // 重新计算布局
      this.fixAllNodes();
      
      // 显示完成消息
      this.showMessage(`已加载 ${loadCount} 个新角色`);
      
      // 提示用户剩余角色数量
      const remainingCount = unloadedCharacters.length - loadCount;
      if (remainingCount > 0) {
        // 更新输入框默认值为剩余数量（如果剩余数量小于当前值）
        if (remainingCount < batchSize) {
          this.loadCountInput.value = remainingCount.toString();
        }
      }
    } catch (error) {
      console.error("加载角色时出错:", error);
      this.showMessage("加载角色时发生错误");
    } finally {
      // 确保无论如何都恢复按钮状态
      this.loadMoreButton.disabled = false;
      this.loadMoreButton.style.opacity = '1';
      this.loadMoreButton.textContent = '加载更多角色';
      this.loadCountInput.disabled = false;
      
      // 更新按钮可见性
      this.updateLoadMoreButtonVisibility();
    }
  }
  
  /**
   * 添加角色节点
   * @param {Object} character - 角色数据
   */
  addCharacterNode(character) {
    // 如果已经加载过，跳过
    if (this.loadedCharacters.has(character.id)) {
      return;
    }
    
    // 确定节点半径 - 主角萧炎使用更大的半径
    const isProtagonist = character.id === 'xiao_yan';
    const nodeRadius = isProtagonist ? 40 : 30;
    
    // 找出与该角色有关系的已加载角色
    const relatedNodes = [];
    this.data.relationships.forEach(rel => {
      if (rel.source === character.id && this.loadedCharacters.has(rel.target)) {
        const targetNode = this.nodes.find(n => n.id === rel.target);
        if (targetNode) relatedNodes.push(targetNode);
      } else if (rel.target === character.id && this.loadedCharacters.has(rel.source)) {
        const sourceNode = this.nodes.find(n => n.id === rel.source);
        if (sourceNode) relatedNodes.push(sourceNode);
      }
    });
    
    let x, y;
    
    // 如果有相关节点，将新节点放在附近
    if (relatedNodes.length > 0) {
      // 计算相关节点的平均位置
      const avgX = relatedNodes.reduce((sum, node) => sum + node.x, 0) / relatedNodes.length;
      const avgY = relatedNodes.reduce((sum, node) => sum + node.y, 0) / relatedNodes.length;
      
      // 添加一些随机偏移，避免重叠
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 50;
      x = avgX + Math.cos(angle) * distance;
      y = avgY + Math.sin(angle) * distance;
    } else {
      // 没有相关节点时，在画布边缘随机位置添加
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.min(this.width, this.height) * 0.4;
      x = this.width / 2 + Math.cos(angle) * radius;
      y = this.height / 2 + Math.sin(angle) * radius;
    }
    
    // 创建新节点
    const newNode = {
      id: character.id,
      name: character.name,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      radius: nodeRadius,
      isProtagonist: isProtagonist,
      fixed: false,
      data: character
    };
    
    // 添加到节点列表
    this.nodes.push(newNode);
    
    // 确保节点不会移出画布
    this.keepNodeInBounds(newNode);
    
    // 标记为已加载
    this.loadedCharacters.add(character.id);
    
    // 更新模拟器 - 重新初始化而不是直接更新节点
    if (this.simulation) {
      // 从关系数据中提取连接（只考虑已加载的角色）
      const links = this.data.relationships
        .filter(rel => 
          this.loadedCharacters.has(rel.source) && 
          this.loadedCharacters.has(rel.target)
        )
        .map(rel => ({
          source: rel.source,
          target: rel.target,
          type: rel.type
        }));
      
      // 重新创建力导向布局实例
      this.simulation = new ForceSimulation(this.nodes, links, {
        linkStrength: 0.05,
        repulsionStrength: 800,
        centerStrength: 0.0001,
        friction: 0.95,
        minDistance: 70,
        linkDistance: 150
      });
      
      // 设置画布尺寸并启动
      this.simulation.setSize(this.width, this.height).start();
    }
    
    return newNode;
  }
  
  /**
   * 为当前已加载的节点加载头像
   */
  loadAvatarsForNodes() {
    this.nodes.forEach(node => {
      // 如果头像已经加载，跳过
      if (this.avatarCache[node.id]) return;
      
      // 获取角色数据
      const character = this.data.characters.find(c => c.id === node.id);
      if (!character) return;
      
      // 加载头像
      const img = new Image();
      img.onload = () => {
        this.avatarCache[node.id] = img;
      };
      img.onerror = () => {
        console.warn(`无法加载角色 ${character.name} 的头像`);
      };
      
      // 使用角色数据中的avatar字段作为路径
      const avatarSrc = character.avatar;
      img.src = avatarSrc;
    });
  }
}

// 导出组件
window.RelationshipGraph = RelationshipGraph; 