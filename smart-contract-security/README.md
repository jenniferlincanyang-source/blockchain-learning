# 智能合约安全

## 学习目标
掌握智能合约常见漏洞和安全审计方法。

## 常见漏洞类型

### 1. 重入攻击（Reentrancy）
外部调用前未更新状态，允许递归调用

### 2. 整数溢出/下溢
Solidity 0.8 之前版本的算术问题

### 3. 访问控制缺陷
权限检查不当或缺失

### 4. 闪电贷攻击
利用无抵押借贷操纵价格预言机

### 5. 前端运行
交易可被监控和抢跑

### 6. 拒绝服务（DoS）
循环中的外部调用导致 gas 耗尽

### 7. 时间戳依赖
依赖 block.timestamp 的逻辑可被操纵

## 安全审计工具

### 静态分析
- **Slither** - 检测常见漏洞模式
- **Mythril** - 符号执行分析
- **Securify** - 形式化验证

### 动态测试
- **Foundry** - Fuzz 测试
- **Echidna** - 属性测试

## 学习路径

### 第一阶段：理解漏洞
1. 学习每种漏洞原理
2. 分析历史攻击案例
3. 在测试网复现漏洞

### 第二阶段：使用工具
1. 安装配置审计工具
2. 扫描示例合约
3. 解读分析报告

### 第三阶段：安全编码
1. 学习 OpenZeppelin 库
2. 遵循安全最佳实践
3. 编写安全测试用例

### 第四阶段：实战审计
1. 审计开源项目
2. 参与 CTF 挑战
3. 尝试漏洞赏金

## 实践项目
- 漏洞合约示例集
- 审计报告模板
- 安全检查清单

## 参考资源
- SWC Registry: https://swcregistry.io
- OpenZeppelin: https://docs.openzeppelin.com
- Damn Vulnerable DeFi: https://www.damnvulnerabledefi.xyz
- Ethernaut: https://ethernaut.openzeppelin.com
