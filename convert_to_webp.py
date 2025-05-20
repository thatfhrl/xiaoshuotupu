#!/usr/bin/env python3
"""
将assets/images目录下的图片转换为WebP格式
新图片保存到images/webp目录下，名字保持不变，但扩展名改为.webp
"""

import os
import sys
from pathlib import Path
from PIL import Image

def convert_to_webp(input_dir='assets/images', output_dir='images/webp', quality=80):
    """
    将指定目录下的所有图片转换为WebP格式
    
    参数:
        input_dir: 输入目录路径，默认为'assets/images'
        output_dir: 输出目录路径，默认为'images/webp'
        quality: WebP质量，范围0-100，默认80
    """
    # 确保输入目录存在
    if not os.path.exists(input_dir):
        print(f"错误: 输入目录 '{input_dir}' 不存在")
        return False
    
    # 创建输出目录
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # 获取所有图片文件
    image_files = []
    for root, _, files in os.walk(input_dir):
        for file in files:
            # 检查文件是否为图片
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff')):
                input_path = os.path.join(root, file)
                # 计算输出路径
                rel_path = os.path.relpath(input_path, input_dir)
                output_path = os.path.join(output_dir, os.path.splitext(rel_path)[0] + '.webp')
                
                # 确保输出目录存在
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                image_files.append((input_path, output_path))
    
    # 转换图片
    total = len(image_files)
    if total == 0:
        print(f"警告: 在 '{input_dir}' 中没有找到图片文件")
        return False
    
    print(f"开始转换 {total} 个图片文件...")
    
    success_count = 0
    for i, (input_path, output_path) in enumerate(image_files, 1):
        try:
            # 打开图片
            with Image.open(input_path) as img:
                # 转换为RGB模式（有些图片可能不是RGB模式）
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # 保存为WebP格式
                img.save(output_path, 'WEBP', quality=quality)
                
                success_count += 1
                print(f"[{i}/{total}] 已转换: {input_path} -> {output_path}")
        except Exception as e:
            print(f"[{i}/{total}] 转换失败: {input_path}")
            print(f"错误: {str(e)}")
    
    print(f"\n转换完成! 成功: {success_count}/{total}")
    return True

if __name__ == "__main__":
    # 解析命令行参数
    input_dir = 'assets/images'
    output_dir = 'assets/images/webp'
    quality = 80
    
    # 如果提供了命令行参数
    if len(sys.argv) > 1:
        input_dir = sys.argv[1]
    if len(sys.argv) > 2:
        output_dir = sys.argv[2]
    if len(sys.argv) > 3:
        try:
            quality = int(sys.argv[3])
            if quality < 0 or quality > 100:
                print("警告: 质量参数必须在0-100之间，将使用默认值80")
                quality = 80
        except ValueError:
            print("警告: 质量参数必须是整数，将使用默认值80")
            quality = 80
    
    print(f"输入目录: {input_dir}")
    print(f"输出目录: {output_dir}")
    print(f"WebP质量: {quality}")
    print("=" * 50)
    
    convert_to_webp(input_dir, output_dir, quality) 