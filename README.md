# 《斗破苍穹》人物关系图谱可视化

![预览图](https://via.placeholder.com/800x400?text=斗破苍穹人物关系图)

## 项目介绍

这是一个基于Canvas的《斗破苍穹》小说人物关系可视化项目，通过力导向算法展示小说中角色之间的关系网络，支持交互、搜索和信息展示功能。

## 功能特点

- **力导向图谱**：基于物理引擎的力导向算法，自动排布节点位置
- **角色信息**：展示角色基本信息和相关视频
- **实时搜索**：支持角色名称和描述搜索
- **交互操作**：拖拽节点、选中查看详情
- **响应式设计**：适配桌面和移动设备
- **图谱保存**：支持将关系图导出为图片
- **社交分享**：支持分享关系图

## 技术实现

- 原生JavaScript（ES6+）面向对象编程
- HTML5 Canvas绘制高性能可视化图形
- 自定义力导向算法实现节点布局
- 面向组件设计架构
- JSON数据驱动渲染

## 快速开始

1. 克隆项目到本地
   ```bash
   git clone https://github.com/yourusername/xuanhuanpu.git
   cd xuanhuanpu
   ```

2. 使用HTTP服务器运行项目
   ```bash
   # 如果有Python
   python -m http.server
   
   # 或使用Node.js的http-server
   npx http-server
   ```

3. 在浏览器中访问 `http://localhost:8000` 或对应端口

## 项目结构

```
/
├── index.html              // 主页面
├── style.css               // 全局样式
├── src/                    // 源代码
│   ├── components/         // 组件
│   │   ├── RelationshipGraph.js  // 关系图组件
│   │   ├── CharacterInfo.js      // 角色信息组件
│   │   └── SearchBar.js          // 搜索栏组件
│   ├── utils/              // 工具类
│   │   └── forceSimulation.js    // 力导向算法实现
│   └── App.js              // 主应用
├── data/                   // 数据
│   └── characters.json     // 角色和关系数据
├── assets/                 // 资源文件
│   ├── images/             // 图片资源
│   └── videos/             // 视频资源
└── README.md               // 说明文档
```

## 数据格式

项目使用JSON格式存储角色和关系数据，示例格式如下：

```json
{
  "characters": [
    {
      "id": "character_id",
      "name": "角色名称",
      "avatar": "头像路径",
      "description": "角色描述",
      "videoUrl": "视频路径"
    }
  ],
  "relationships": [
    {
      "source": "源角色ID",
      "target": "目标角色ID",
      "type": "关系类型"
    }
  ]
}
```

## 自定义数据

如果你想展示其他小说或内容的角色关系，只需修改 `data/characters.json` 文件即可：

1. 替换角色数据，每个角色需包含id、name、avatar、description字段
2. 定义角色之间的关系，包含source、target和type字段
3. 添加对应的角色头像到 `assets/images/` 目录
4. 可选：添加角色相关视频到 `assets/videos/` 目录

## 浏览器兼容性

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 贡献指南

欢迎提交Issues和Pull Requests来完善此项目：

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 详情请参见 [LICENSE](LICENSE) 文件

## 致谢

- 感谢《斗破苍穹》作者天蚕土豆创作的精彩世界
- 感谢所有为本项目提供反馈和建议的人 