/**
 * 角色卡片展示组件
 * 以卡片形式展示所有角色的头像、名字和描述，并提供卡片大小调节功能
 */
class CharacterCards {
  /**
   * 构造函数
   * @param {HTMLElement} container - 容器DOM元素
   * @param {Object} data - 角色数据
   */
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.cardSize = 200; // 默认卡片大小
    this.spacing = 20; // 卡片间距
    this.columns = 3; // 默认列数
    
    // 初始化UI
    this.setupUI();
    
    // 渲染卡片
    this.renderCards();
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  /**
   * 设置UI界面
   */
  setupUI() {
    // 清空容器
    this.container.innerHTML = '';
    this.container.style.padding = '20px';
    
    // 创建控制面板
    this.createControlPanel();
    
    // 创建卡片容器
    this.cardsContainer = document.createElement('div');
    this.cardsContainer.className = 'character-cards-container';
    this.cardsContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: ${this.spacing}px;
      margin-top: 20px;
    `;
    
    this.container.appendChild(this.cardsContainer);
  }
  
  /**
   * 创建控制面板
   */
  createControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.className = 'control-panel';
    controlPanel.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding: 15px;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 8px;
    `;
    
    // 创建卡片大小滑块
    const sizeControl = document.createElement('div');
    sizeControl.style.cssText = `
      display: flex;
      align-items: center;
      margin-right: 30px;
    `;
    
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = '卡片大小: ';
    sizeLabel.style.marginRight = '10px';
    
    const sizeSlider = document.createElement('input');
    sizeSlider.type = 'range';
    sizeSlider.min = '150';
    sizeSlider.max = '300';
    sizeSlider.value = this.cardSize;
    sizeSlider.style.width = '150px';
    
    const sizeValue = document.createElement('span');
    sizeValue.textContent = `${this.cardSize}px`;
    sizeValue.style.marginLeft = '10px';
    sizeValue.style.width = '50px';
    
    sizeSlider.addEventListener('input', (e) => {
      this.cardSize = parseInt(e.target.value);
      sizeValue.textContent = `${this.cardSize}px`;
      this.renderCards();
    });
    
    sizeControl.appendChild(sizeLabel);
    sizeControl.appendChild(sizeSlider);
    sizeControl.appendChild(sizeValue);
    
    // 创建列数调整滑块
    const columnsControl = document.createElement('div');
    columnsControl.style.cssText = `
      display: flex;
      align-items: center;
    `;
    
    const columnsLabel = document.createElement('label');
    columnsLabel.textContent = '列数: ';
    columnsLabel.style.marginRight = '10px';
    
    const columnsSlider = document.createElement('input');
    columnsSlider.type = 'range';
    columnsSlider.min = '1';
    columnsSlider.max = '6';
    columnsSlider.value = this.columns;
    columnsSlider.style.width = '150px';
    
    const columnsValue = document.createElement('span');
    columnsValue.textContent = this.columns;
    columnsValue.style.marginLeft = '10px';
    columnsValue.style.width = '20px';
    
    columnsSlider.addEventListener('input', (e) => {
      this.columns = parseInt(e.target.value);
      columnsValue.textContent = this.columns;
      this.renderCards();
    });
    
    columnsControl.appendChild(columnsLabel);
    columnsControl.appendChild(columnsSlider);
    columnsControl.appendChild(columnsValue);
    
    // 添加到控制面板
    controlPanel.appendChild(sizeControl);
    controlPanel.appendChild(columnsControl);
    
    // 添加搜索框
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      display: flex;
      align-items: center;
      margin-left: auto;
    `;
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索角色...';
    searchInput.style.cssText = `
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #ccc;
      width: 200px;
    `;
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      this.filterCards(query);
    });
    
    searchContainer.appendChild(searchInput);
    controlPanel.appendChild(searchContainer);
    
    this.container.appendChild(controlPanel);
  }
  
  /**
   * 根据搜索条件过滤卡片
   * @param {string} query - 搜索关键词
   */
  filterCards(query) {
    const cards = this.cardsContainer.querySelectorAll('.character-card');
    
    cards.forEach(card => {
      const name = card.querySelector('.character-name').textContent.toLowerCase();
      const description = card.querySelector('.character-description').textContent.toLowerCase();
      
      if (name.includes(query) || description.includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }
  
  /**
   * 渲染角色卡片
   */
  renderCards() {
    // 清空卡片容器
    this.cardsContainer.innerHTML = '';
    
    // 计算卡片宽度
    const cardWidth = this.cardSize;
    
    // 设置卡片容器样式
    this.cardsContainer.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
    this.cardsContainer.style.display = 'grid';
    this.cardsContainer.style.gap = `${this.spacing}px`;
    
    // 创建每个角色的卡片
    this.data.characters.forEach(character => {
      const card = document.createElement('div');
      card.className = 'character-card';
      card.style.cssText = `
        width: 100%;
        background-color: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s, box-shadow 0.3s;
        display: flex;
        flex-direction: column;
      `;
      
      // 卡片悬浮效果
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'none';
        card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
      });
      
      // 角色头像区域
      const avatarContainer = document.createElement('div');
      avatarContainer.style.cssText = `
        width: 100%;
        height: ${cardWidth}px;
        background-color: #f5f5f5;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
      `;
      
      // 角色头像
      const avatar = document.createElement('img');
      avatar.src = character.avatar || `assets/images/webp/${character.id}.webp`;
      avatar.alt = character.name;
      avatar.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      
      avatar.onerror = () => {
        avatar.src = 'assets/images/default_avatar.png';
        console.warn(`无法加载角色 ${character.name} 的头像`);
      };
      
      avatarContainer.appendChild(avatar);
      
      // 角色信息区域
      const infoContainer = document.createElement('div');
      infoContainer.style.cssText = `
        padding: 15px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      `;
      
      // 角色名称
      const nameElement = document.createElement('h3');
      nameElement.className = 'character-name';
      nameElement.textContent = character.name;
      nameElement.style.cssText = `
        margin: 0 0 10px 0;
        font-size: 18px;
        color: #333;
      `;
      
      // 角色描述
      const descriptionElement = document.createElement('p');
      descriptionElement.className = 'character-description';
      descriptionElement.textContent = character.description || '暂无描述';
      descriptionElement.style.cssText = `
        margin: 0;
        font-size: 14px;
        color: #666;
        line-height: 1.5;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
      `;
      
      infoContainer.appendChild(nameElement);
      infoContainer.appendChild(descriptionElement);
      
      // 组装卡片
      card.appendChild(avatarContainer);
      card.appendChild(infoContainer);
      
      // 添加到容器
      this.cardsContainer.appendChild(card);
      
      // 添加点击事件 - 显示详细信息
      card.addEventListener('click', () => {
        this.showCharacterDetail(character);
      });
    });
  }
  
  /**
   * 显示角色详细信息
   * @param {Object} character - 角色数据
   */
  showCharacterDetail(character) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'character-detail-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    
    // 创建详细信息卡片
    const detailCard = document.createElement('div');
    detailCard.className = 'character-detail-card';
    detailCard.style.cssText = `
      background-color: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      width: 80%;
      max-width: 1000px;
      max-height: 80vh;
    `;
    
    // 头像区域
    const avatarSection = document.createElement('div');
    avatarSection.style.cssText = `
      width: 40%;
      background-color: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    `;
    
    const avatar = document.createElement('img');
    avatar.src = character.avatar || `assets/images/${character.id}.png`;
    avatar.alt = character.name;
    avatar.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    
    avatar.onerror = () => {
      avatar.src = 'assets/images/default_avatar.png';
    };
    
    avatarSection.appendChild(avatar);
    
    // 信息区域
    const infoSection = document.createElement('div');
    infoSection.style.cssText = `
      width: 60%;
      padding: 30px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    `;
    
    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
      background: transparent;
      border: none;
      font-size: 30px;
      color: black;
      cursor: pointer;
    `;
    
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // 角色名称
    const nameElement = document.createElement('h2');
    nameElement.textContent = character.name;
    nameElement.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 28px;
      color: #333;
    `;
    
    // ID信息
    const idElement = document.createElement('p');
    idElement.textContent = `ID: ${character.id}`;
    idElement.style.cssText = `
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #888;
    `;
    
    // 描述标题
    const descriptionTitle = document.createElement('h3');
    descriptionTitle.textContent = '角色描述';
    descriptionTitle.style.cssText = `
      margin: 20px 0 10px 0;
      font-size: 18px;
      color: #333;
    `;
    
    // 角色描述
    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = character.description || '暂无描述';
    descriptionElement.style.cssText = `
      margin: 0;
      font-size: 16px;
      color: #555;
      line-height: 1.6;
    `;
    
    infoSection.appendChild(nameElement);
    infoSection.appendChild(idElement);
    infoSection.appendChild(descriptionTitle);
    infoSection.appendChild(descriptionElement);
    
    detailCard.appendChild(avatarSection);
    detailCard.appendChild(infoSection);
    detailCard.appendChild(closeButton);
    
    modal.appendChild(detailCard);
    
    // 点击模态框背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    document.body.appendChild(modal);
  }
  
  /**
   * 处理窗口大小变化
   */
  handleResize() {
    // 根据容器宽度自动调整列数
    const containerWidth = this.container.clientWidth;
    const newColumns = Math.max(1, Math.floor(containerWidth / (this.cardSize + this.spacing)));
    
    if (newColumns !== this.columns) {
      this.columns = newColumns;
      this.renderCards();
    }
  }
}

// 导出组件
window.CharacterCards = CharacterCards; 