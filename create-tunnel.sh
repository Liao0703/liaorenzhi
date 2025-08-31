#!/bin/bash

echo "======================================"
echo "创建SSH隧道到RDS"
echo "======================================"
echo ""
echo "这个命令会创建一个本地端口转发："
echo "本地3307端口 -> 服务器 -> 阿里云RDS"
echo ""
echo "执行后，Navicat连接配置："
echo "  主机: localhost"
echo "  端口: 3307"
echo "  用户: admin123"
echo "  密码: Liao0820"
echo ""
echo "正在创建隧道（需要输入服务器密码）..."
echo "按 Ctrl+C 停止隧道"
echo ""

# 创建SSH隧道
ssh -L 3307:rm-cn-7js4el1by00015fo.rwlb.cn-chengdu.rds.aliyuncs.com:3306 \
    root@47.109.142.72 \
    -N -v
