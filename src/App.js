/**
 * 主应用类
 * 负责初始化并连接所有组件
 */
class App {
  /**
   * 构造函数
   */
  constructor() {
    // 加载数据
    this.loadData()
      .then(data => {
        this.data = data;
        this.init();
      })
      .catch(error => {
        console.error('加载数据失败:', error);
        this.showError('数据加载失败，请刷新页面重试');
      });
  }
  
  /**
   * 加载角色和关系数据
   * @returns {Promise} 加载完成的Promise
   */
  loadData() {
    return fetch('data/characters.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('无法加载角色数据');
        }
        return response.json();
      });
  }
  
  /**
   * 初始化应用
   */
  init() {
    // 初始化图形区域
    const graphContainer = document.getElementById('graph-container');
    this.graph = new RelationshipGraph(graphContainer, this.data);
    
    // 初始化角色信息面板
    const infoPanel = document.getElementById('character-info');
    this.characterInfo = new CharacterInfo(infoPanel);
    
    // 初始化搜索框
    const searchContainer = document.getElementById('search-container');
    this.searchBar = new SearchBar(searchContainer, this.data.characters);
    
    // 连接组件间的事件
    this.graph.setOnSelectCallback(this.handleCharacterSelect.bind(this));
    this.searchBar.setOnSelectCallback(this.handleSearchSelect.bind(this));
    
    // 设置底部控制按钮事件
    this.setupControls();
    
    // 设置标题编辑和背景图片替换
    this.setupTitleAndBackground();
    
    // 默认选中第一个角色
    this.handleCharacterSelect(this.data.characters[0]);
  }
  
  /**
   * 设置标题编辑和背景图片替换功能
   */
  setupTitleAndBackground() {
    // 标题编辑功能
    const titleInput = document.getElementById('graph-title');
    if (titleInput) {
      // 保存原始标题
      this.originalTitle = titleInput.value;
      
      // 聚焦时选中全部文本
      titleInput.addEventListener('focus', () => {
        setTimeout(() => titleInput.select(), 0);
      });
      
      // 失焦时保存标题
      titleInput.addEventListener('blur', () => {
        if (!titleInput.value.trim()) {
          titleInput.value = this.originalTitle;
        }
      });
      
      // 按回车键保存标题
      titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          titleInput.blur();
          e.preventDefault();
        }
      });
    }
    
    // 背景图片替换功能
    const bgImageUpload = document.getElementById('bg-image-upload');
    if (bgImageUpload) {
      bgImageUpload.addEventListener('change', (e) => {
        this.handleBackgroundImageUpload(e);
      });
    }
  }
  
  /**
   * 处理背景图片上传
   * @param {Event} event - 文件上传事件
   */
  handleBackgroundImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const graphContainer = document.getElementById('graph-container');
        if (graphContainer) {
          // 保存原始背景
          if (!this.originalBackground) {
            this.originalBackground = graphContainer.style.backgroundImage;
          }
          
          // 设置新背景
          graphContainer.style.backgroundImage = `url(${e.target.result})`;
          this.showMessage('背景图片已更新');
        }
      };
      reader.readAsDataURL(file);
    } else {
      this.showError('请选择有效的图片文件');
    }
  }
  
  /**
   * 设置底部控制按钮
   */
  setupControls() {
    // 重置按钮
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
      this.graph.reset();
      
      // 重置背景图片（如果已更改）
      if (this.originalBackground) {
        const graphContainer = document.getElementById('graph-container');
        if (graphContainer) {
          graphContainer.style.backgroundImage = this.originalBackground;
        }
      }
      
      // 重置标题（如果已更改）
      if (this.originalTitle) {
        const titleInput = document.getElementById('graph-title');
        if (titleInput && titleInput.value !== this.originalTitle) {
          titleInput.value = this.originalTitle;
        }
      }
    });
    
    // 关系显示切换
    const relationToggle = document.getElementById('relation-toggle');
    relationToggle.addEventListener('change', (e) => {
      // 可以通过添加一个方法来切换是否显示所有关系
      // this.graph.toggleRelationships(e.target.checked);
    });
    
    // 保存按钮
    const saveBtn = document.getElementById('save-btn');
    saveBtn.addEventListener('click', () => {
      this.saveImage();
    });
    
    // 分享按钮
    const shareBtn = document.getElementById('share-btn');
    shareBtn.addEventListener('click', () => {
      this.shareGraph();
    });
  }
  
  /**
   * 处理从图谱中选中角色
   * @param {Object} character - 选中的角色数据
   */
  handleCharacterSelect(character) {
    if (character) {
      this.characterInfo.updateInfo(character);
    }
  }
  
  /**
   * 处理从搜索中选中角色
   * @param {string} characterId - 选中的角色ID
   */
  handleSearchSelect(characterId) {
    const character = this.data.characters.find(c => c.id === characterId);
    if (character) {
      this.characterInfo.updateInfo(character);
      this.graph.selectNodeById(characterId);
    }
  }
  
  /**
   * 保存图谱为图片
   */
  saveImage() {
    try {
      // 获取canvas元素
      const canvas = this.graph.canvas;
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = '斗破苍穹_人物关系图.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('保存图片失败:', error);
      this.showMessage('保存图片失败，请重试');
    }
  }
  
  /**
   * 分享图谱
   */
  shareGraph() {
    // 如果支持原生分享API
    if (navigator.share) {
      navigator.share({
        title: '《斗破苍穹》人物关系图',
        text: '查看《斗破苍穹》的角色关系网络图',
        url: window.location.href
      }).catch(error => {
        console.error('分享失败:', error);
      });
    } else {
      // 复制当前页面URL到剪贴板
      const dummy = document.createElement('input');
      document.body.appendChild(dummy);
      dummy.value = window.location.href;
      dummy.select();
      document.execCommand('copy');
      document.body.removeChild(dummy);
      
      this.showMessage('链接已复制到剪贴板');
    }
  }
  
  /**
   * 显示错误消息
   * @param {string} message - 错误消息
   */
  showError(message) {
    this.showMessage(message, 'error');
  }
  
  /**
   * 显示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   */
  showMessage(message, type = 'info') {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // 添加消息样式
    const style = document.createElement('style');
    style.textContent = `
      .message {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .message.info {
        background-color: rgba(76, 139, 245, 0.9);
      }
      
      .message.error {
        background-color: rgba(235, 87, 87, 0.9);
      }
      
      .message.show {
        opacity: 1;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(messageElement);
    
    // 显示消息
    setTimeout(() => {
      messageElement.classList.add('show');
    }, 10);
    
    // 3秒后隐藏并移除消息
    setTimeout(() => {
      messageElement.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(messageElement);
      }, 300);
    }, 3000);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
}); 