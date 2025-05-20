/**
 * 搜索栏组件
 * 负责实现角色搜索功能
 */
class SearchBar {
  /**
   * 构造函数
   * @param {HTMLElement} container - 搜索框容器DOM元素
   * @param {Array} characters - 角色数据数组
   */
  constructor(container, characters) {
    this.container = container;
    this.characters = characters;
    
    // 获取搜索输入框
    this.searchInput = document.getElementById('search-input');
    
    // 创建搜索结果容器
    this.createResultsContainer();
    
    // 设置事件监听
    this.setupEventListeners();
    
    // 选中回调
    this.onSelectCallback = null;
  }
  
  /**
   * 创建搜索结果容器
   */
  createResultsContainer() {
    // 创建搜索结果容器
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'search-results';
    this.resultsContainer.style.display = 'none';
    this.container.appendChild(this.resultsContainer);
    
    // 添加搜索结果样式
    const style = document.createElement('style');
    style.textContent = `
      .search-container {
        position: relative;
      }
      
      .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background-color: rgba(27, 38, 77, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        margin-top: 5px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 10;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
      
      .search-result-item {
        display: flex;
        align-items: center;
        padding: 8px 10px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .search-result-item:hover {
        background-color: rgba(76, 139, 245, 0.2);
      }
      
      .search-result-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        margin-right: 10px;
        object-fit: cover;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .search-result-name {
        color: white;
        font-size: 14px;
      }
      
      .no-results {
        padding: 10px;
        color: rgba(255, 255, 255, 0.7);
        text-align: center;
        font-size: 14px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 输入时进行搜索
    this.searchInput.addEventListener('input', this.handleSearch.bind(this));
    
    // 失去焦点时隐藏结果
    this.searchInput.addEventListener('blur', () => {
      // 延迟隐藏，确保点击结果项的事件能触发
      setTimeout(() => {
        this.resultsContainer.style.display = 'none';
      }, 200);
    });
    
    // 获得焦点时，如果有内容则显示结果
    this.searchInput.addEventListener('focus', () => {
      if (this.searchInput.value.trim()) {
        this.handleSearch();
      }
    });
    
    // 监听按键事件（Esc关闭结果）
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.resultsContainer.style.display = 'none';
      }
    });
    
    // 点击外部区域关闭搜索结果
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.resultsContainer.style.display = 'none';
      }
    });
  }
  
  /**
   * 处理搜索
   */
  handleSearch() {
    const searchTerm = this.searchInput.value.trim().toLowerCase();
    
    // 如果搜索词为空，隐藏结果并返回
    if (!searchTerm) {
      this.resultsContainer.style.display = 'none';
      return;
    }
    
    // 搜索匹配的角色
    const matchedCharacters = this.characters.filter(character => {
      return character.name.toLowerCase().includes(searchTerm) || 
             character.description.toLowerCase().includes(searchTerm);
    });
    
    // 显示搜索结果
    this.displayResults(matchedCharacters);
  }
  
  /**
   * 显示搜索结果
   * @param {Array} characters - 匹配的角色数组
   */
  displayResults(characters) {
    // 清空旧结果
    this.resultsContainer.innerHTML = '';
    
    // 如果没有结果
    if (characters.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = '没有找到匹配的角色';
      this.resultsContainer.appendChild(noResults);
    } else {
      // 添加结果项
      characters.forEach(character => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        
        // 创建头像
        const avatar = document.createElement('img');
        avatar.className = 'search-result-avatar';
        avatar.src = character.avatar;
        avatar.alt = character.name;
        
        // 创建名称
        const name = document.createElement('div');
        name.className = 'search-result-name';
        name.textContent = character.name;
        
        // 添加到结果项
        resultItem.appendChild(avatar);
        resultItem.appendChild(name);
        
        // 点击结果项时触发选中事件
        resultItem.addEventListener('click', () => {
          this.handleSelect(character.id);
          this.resultsContainer.style.display = 'none';
          this.searchInput.value = ''; // 清空搜索框
        });
        
        // 添加到结果容器
        this.resultsContainer.appendChild(resultItem);
      });
    }
    
    // 显示结果容器
    this.resultsContainer.style.display = 'block';
  }
  
  /**
   * 处理选中角色
   * @param {string} characterId - 选中的角色ID
   */
  handleSelect(characterId) {
    if (this.onSelectCallback) {
      this.onSelectCallback(characterId);
    }
  }
  
  /**
   * 设置选中角色的回调函数
   * @param {Function} callback - 选中角色时的回调
   */
  setOnSelectCallback(callback) {
    this.onSelectCallback = callback;
  }
}

// 导出组件
window.SearchBar = SearchBar; 