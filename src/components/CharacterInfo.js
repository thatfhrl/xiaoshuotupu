/**
 * 角色信息组件
 * 负责在侧边栏中显示选中角色的详细信息
 */
class CharacterInfo {
  /**
   * 构造函数
   * @param {HTMLElement} container - 信息容器DOM元素
   */
  constructor(container) {
    this.container = container;
    
    // 获取DOM元素
    this.avatarElement = document.getElementById('character-avatar');
    this.nameElement = document.getElementById('character-name');
    this.descElement = document.getElementById('character-desc');
    this.videoContainer = document.getElementById('character-video-container');
    
    // 当前显示的角色
    this.currentCharacter = null;
    
    // 添加图像处理优化
    this.setupImageOptimizations();
  }
  
  /**
   * 设置图像优化
   */
  setupImageOptimizations() {
    // 为图像添加渲染优化
    if (this.avatarElement) {
      // 添加图像渲染质量优化
      this.avatarElement.style.imageRendering = 'high-quality';
      // 禁用图像平滑处理，避免放大时过度平滑导致模糊
      this.avatarElement.style.imageRendering = '-webkit-optimize-contrast';
    }
  }
  
  /**
   * 更新角色信息
   * @param {Object} character - 角色数据
   */
  updateInfo(character) {
    if (!character) return;
    
    // 保存当前角色
    this.currentCharacter = character;
    
    // 更新角色头像
    this.avatarElement.src = character.avatar;
    this.avatarElement.alt = character.name;
    
    // 更新角色名称
    this.nameElement.textContent = character.name;
    
    // 更新角色描述
    this.descElement.textContent = character.description;
    
    // 更新视频
    this.updateVideo(character.videoUrl);
  }
  
  /**
   * 更新角色视频
   * @param {string} videoUrl - 视频地址
   */
  updateVideo(videoUrl) {
    // 清空旧内容
    this.videoContainer.innerHTML = '';
    
    if (!videoUrl) return;
    
    // 创建视频元素
    const video = document.createElement('video');
    video.src = videoUrl;
    video.controls = true;
    video.preload = 'metadata';
    video.poster = this.currentCharacter.avatar; // 使用角色头像作为封面
    
    // 添加播放按钮覆盖层
    const playOverlay = document.createElement('div');
    playOverlay.className = 'video-play-overlay';
    playOverlay.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><path fill="white" d="M8 5v14l11-7z"/></svg>';
    
    // 点击播放按钮时播放视频
    playOverlay.addEventListener('click', () => {
      video.play();
      playOverlay.style.display = 'none';
    });
    
    // 视频播放结束时重新显示播放按钮
    video.addEventListener('ended', () => {
      playOverlay.style.display = 'flex';
    });
    
    // 视频暂停时显示播放按钮
    video.addEventListener('pause', () => {
      playOverlay.style.display = 'flex';
    });
    
    // 视频播放时隐藏播放按钮
    video.addEventListener('play', () => {
      playOverlay.style.display = 'none';
    });
    
    // 创建包装容器
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';
    videoWrapper.appendChild(video);
    videoWrapper.appendChild(playOverlay);
    
    // 添加到容器
    this.videoContainer.appendChild(videoWrapper);
    
    // 添加视频播放样式
    const style = document.createElement('style');
    style.textContent = `
      .video-wrapper {
        position: relative;
        width: 100%;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .video-play-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
      }
      
      .video-play-overlay svg {
        filter: drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.5));
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 清空角色信息
   */
  clearInfo() {
    this.currentCharacter = null;
    this.avatarElement.src = '';
    this.nameElement.textContent = '';
    this.descElement.textContent = '';
    this.videoContainer.innerHTML = '';
  }
}

// 导出组件
window.CharacterInfo = CharacterInfo; 