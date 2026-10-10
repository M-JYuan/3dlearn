/**
 * 案例配置中心 v3.0
 * ============================================
 * 所有3D演示案例的统一配置文件
 * 包含场景介绍模态框内容
 * ============================================
 */

window.CasesConfig = {
    /**
     * 案例列表
     */
    CASES: [
        {
            id: 'attention',
            title: '注意力机制原理',
            keywords: ['注意力', 'attention', '大模型', 'transformer', 'llm', '自注意力'],
            type: 'scene',
            sceneClass: 'AttentionScene',
            icon: 'fa-brain',
            description: '探索Transformer的自注意力机制',
            difficulty: 3,
            // 介绍模态框内容
            intro: {
                subtitle: 'Transformer Self-Attention 可视化',
                objectives: [
                    '理解词嵌入（Word Embedding）的概念',
                    '掌握 Query-Key-Value 三元组的作用',
                    '了解注意力权重如何聚合信息'
                ],
                keyPoints: ['词向量', 'Q·K点积', 'Softmax', '加权求和'],
                tips: '点击词元节点查看注意力分布，使用步骤按钮逐步学习'
            }
        },
        {
            id: 'engine',
            title: 'V6 赛博引擎',
            keywords: ['发动机', '引擎', 'v6', '气缸', '活塞'],
            type: 'scene',
            sceneClass: 'EngineScene',
            icon: 'fa-cogs',
            description: '赛博朋克风格的V6发动机运转动画',
            difficulty: 2,
            intro: {
                subtitle: '四冲程内燃机工作原理',
                objectives: [
                    '理解四冲程循环：进气→压缩→做功→排气',
                    '了解曲轴如何将往复运动转为旋转',
                    '认识V型发动机的结构优势'
                ],
                keyPoints: ['四冲程', '活塞运动', '曲轴', '点火顺序'],
                tips: '使用步骤按钮分别查看四个冲程，点击部件了解详情'
            }
        },
        {
            id: 'quantum',
            title: '双缝干涉实验',
            keywords: ['双缝', '干涉', '量子', '波函数', '观察者', '波粒二象性'],
            type: 'scene',
            sceneClass: 'QuantumScene',
            icon: 'fa-atom',
            description: '量子力学双缝干涉实验',
            difficulty: 4,
            intro: {
                subtitle: '波粒二象性与观察者效应',
                objectives: [
                    '理解电子的波动性和粒子性',
                    '观察干涉条纹的形成过程',
                    '体验"观察"如何改变实验结果'
                ],
                keyPoints: ['波粒二象性', '干涉条纹', '观察者效应', '量子叠加'],
                tips: '先运行波动实验看干涉，再开启观测看变化！'
            }
        },
        {
            id: 'hydraulic',
            title: '液压传动系统',
            keywords: ['液压', '水压', '帕斯卡', '流体', '千斤顶'],
            type: 'scene',
            sceneClass: 'HydraulicScene',
            icon: 'fa-tint',
            description: '帕斯卡定律可视化',
            difficulty: 2,
            intro: {
                subtitle: '帕斯卡定律与力的放大',
                objectives: [
                    '理解密闭液体传递压强的原理',
                    '掌握力的放大公式：F₂/F₁ = A₂/A₁',
                    '了解液压系统在千斤顶等设备中的应用'
                ],
                keyPoints: ['压强相等', '面积比', '力的放大', '不可压缩'],
                tips: '调节输入力大小，观察输出力的变化倍数'
            }
        },
        {
            id: 'pendulum',
            title: '单摆运动实验',
            keywords: ['单摆', '简谐', '周期', '摆长', '重力加速度', 't=2π'],
            type: 'scene',
            sceneClass: 'PendulumScene',
            icon: 'fa-clock',
            description: '简谐运动与能量守恒可视化',
            difficulty: 2,
            intro: {
                subtitle: '简谐运动与周期规律',
                objectives: [
                    '理解单摆的简谐运动特征',
                    '认识摆长对周期的影响',
                    '观察势能与动能的转化'
                ],
                keyPoints: ['T=2π√(L/g)', '能量守恒', '小角度近似'],
                tips: '拖动摆球或调整参数，观察周期变化'
            }
        },
        {
            id: 'electromagnetic',
            title: '电磁感应实验',
            keywords: ['电磁感应', '法拉第', '楞次', '磁通量', '线圈', '感应电流'],
            type: 'scene',
            sceneClass: 'ElectromagneticScene',
            icon: 'fa-magnet',
            description: '磁通量变化产生感应电动势',
            difficulty: 3,
            intro: {
                subtitle: '法拉第定律与楞次定律',
                objectives: [
                    '理解磁通量变化产生感应电动势',
                    '观察感应电流方向的变化',
                    '掌握楞次定律的“反抗变化”原则'
                ],
                keyPoints: ['ε=-dΦ/dt', '楞次定律', '磁通量变化'],
                tips: '移动磁铁速度和方向，观察电流表变化'
            }
        },
        {
            id: 'circuit-ohm',
            title: '串并联电路与欧姆定律',
            keywords: ['串联', '并联', '欧姆定律', '电路', '电流', '电压', '电阻', 'U=IR', '等效电阻'],
            type: 'scene',
            sceneClass: 'CircuitOhmScene',
            icon: 'fa-bolt',
            description: '切换串并联并调节电阻，直观理解 U=IR 与等效电阻',
            difficulty: 2,
            intro: {
                subtitle: '电路连接方式与欧姆定律可视化',
                objectives: [
                    '区分串联与并联的连接方式',
                    '理解等效电阻变化对电流的影响',
                    '通过调参验证欧姆定律 U=IR',
                    '完成练习并输出掌握度总结'
                ],
                keyPoints: ['串联', '并联', '等效电阻', 'U=IR', '电流与功率'],
                tips: '先切换模式再调节 R1/R2，观察 Req、I、P 变化趋势'
            }
        },
        {
            id: 'vector3d',
            title: '三维向量与运算',
            keywords: ['向量', '三维', '空间向量', '点积', '叉积', '平行四边形'],
            type: 'scene',
            sceneClass: 'Vector3DScene',
            icon: 'fa-vector-square',
            description: '空间向量可视化与运算展示',
            difficulty: 3,
            intro: {
                subtitle: '向量表示与运算几何意义',
                objectives: [
                    '理解向量在三维坐标中的表示',
                    '掌握向量加法的几何解释',
                    '了解点积与叉积的意义'
                ],
                keyPoints: ['坐标表示', '平行四边形', '点积', '叉积'],
                tips: '点击按钮展示向量加法、叉积和平行四边形'
            }
        },
        {
            id: 'conic',
            title: '圆锥曲线截面',
            keywords: ['圆锥曲线', '椭圆', '抛物线', '双曲线', '圆', '切割'],
            type: 'scene',
            sceneClass: 'ConicScene',
            icon: 'fa-draw-polygon',
            description: '平面截圆锥产生的曲线',
            difficulty: 3,
            intro: {
                subtitle: '切割角度决定曲线形态',
                objectives: [
                    '理解圆锥曲线的几何来源',
                    '区分椭圆、抛物线、双曲线与圆',
                    '掌握离心率与曲线类型的关系'
                ],
                keyPoints: ['切割角度', '离心率', '平面与圆锥交线'],
                tips: '切换不同曲线按钮，观察截面变化'
            }
        },
        {
            id: 'quadratic-function',
            title: '二次函数图像与参数变换',
            keywords: ['二次函数', '抛物线', 'a b c', '顶点', '对称轴', '函数图像', '参数变换', '代数'],
            type: 'scene',
            sceneClass: 'QuadraticFunctionScene',
            icon: 'fa-square-root-alt',
            description: '通过调节 a、b、c 理解二次函数图像变化与参数作用',
            difficulty: 2,
            intro: {
                subtitle: '从参数到图像的直觉建立',
                objectives: [
                    '理解参数 a 对开口方向与宽窄的影响',
                    '理解参数 b 对对称轴位置的影响',
                    '理解参数 c 对上下平移与截距的影响',
                    '通过练习完成“图像-公式”双向判断'
                ],
                keyPoints: ['y=ax²+bx+c', '顶点坐标', '对称轴', '参数联动'],
                tips: '先固定两个参数，再调第三个参数，观察单变量影响最清晰'
            }
        },
        {
            id: 'drumflower',
            title: '击鼓传花',
            keywords: ['击鼓传花', '传花', '周期', '余数', '循环', '小学数学', '传递'],
            type: 'scene',
            sceneClass: 'DrumFlowerScene',
            icon: 'fa-drum',
            description: '理解周期性与余数的趣味数学',
            difficulty: 1,
            intro: {
                subtitle: '周期规律与余数应用',
                objectives: [
                    '理解循环与周期的概念',
                    '学会用余数解决"传了N次在谁手里"问题',
                    '掌握周期性问题的通用解法'
                ],
                keyPoints: ['8人围圈', '周期=8', '余数定位置', '循环规律'],
                tips: '点击"题目1"或"题目2"查看完整解题过程！'
            }
        },
        {
            id: 'gravity',
            title: '万有引力与时空弯曲',
            keywords: ['万有引力', '引力', '时空', '弯曲', '爱因斯坦', '牛顿', '引力波', '黑洞', '霍金', '广义相对论'],
            type: 'scene',
            sceneClass: 'GravityScene',
            icon: 'fa-globe',
            description: '从牛顿到爱因斯坦，探索引力的本质',
            difficulty: 3,
            intro: {
                subtitle: '牛顿万有引力 × 爱因斯坦广义相对论',
                objectives: [
                    '理解牛顿万有引力定律 F = GMm/r²',
                    '认识爱因斯坦的时空弯曲概念',
                    '观察引力波的传播和探测原理',
                    '了解黑洞和霍金辐射'
                ],
                keyPoints: ['万有引力', '时空弯曲', '引力波', '黑洞', '事件视界', '霍金辐射'],
                tips: '使用模式按钮切换不同教学内容，释放测试粒子观察轨道运动！'
            }
        },
        {
            id: 'nuclearfission',
            title: '核裂变链式反应',
            keywords: ['核裂变', '链式反应', '原子弹', '核电站', '铀', 'U235', '中子', '临界质量', '核能', '裂变'],
            type: 'scene',
            sceneClass: 'NuclearFissionScene',
            icon: 'fa-radiation',
            description: '一个中子引发的指数级爆炸',
            difficulty: 3,
            intro: {
                subtitle: '从一个中子到链式反应',
                objectives: [
                    '理解铀-235原子核结构',
                    '观察中子撞击引发核分裂的过程',
                    '认识链式反应的指数增长特性',
                    '了解核能释放的原理 E=mc²'
                ],
                keyPoints: ['铀-235', '中子撞击', '核分裂', '链式反应', '裂变产物', '能量释放'],
                tips: '点击"开始反应"发射中子，观察如何引发连锁裂变！'
            }
        },
        {
            id: 'migdal',
            title: '米格达尔效应',
            keywords: ['米格达尔', 'migdal', '暗物质', '中子碰撞', '量子力学', '电子激发', '共顶点', '核反冲', '中科院'],
            type: 'scene',
            sceneClass: 'MigdalScene',
            icon: 'fa-atom',
            description: '2026年首次被直接证实的量子效应',
            difficulty: 4,
            intro: {
                subtitle: '80年后首次直接证实的量子预言',
                objectives: [
                    '理解原子核与电子的相互作用',
                    '观察中子碰撞引发的核反冲过程',
                    '认识电场剧变如何传递能量给电子',
                    '了解"共顶点轨迹"的物理意义',
                    '理解米格达尔效应对暗物质探测的重要性'
                ],
                keyPoints: ['中子碰撞', '核反冲', '电场剧变', '米格达尔电子', '共顶点轨迹', '暗物质探测'],
                tips: '按步骤学习，点击各部件了解详情。观察核反冲和电子逃逸如何形成独特的双轨迹！'
            }
        },
        {
            id: 'schrodinger',
            title: '薛定谔的猫',
            keywords: ['薛定谔', 'schrodinger', '量子叠加', '叠加态', '波函数坍缩', '量子力学', '观测', '猫', '量子'],
            type: 'scene',
            sceneClass: 'SchrodingerCatScene',
            icon: 'fa-cat',
            description: '一只猫同时"活着又死了"的可视化',
            difficulty: 3,
            intro: {
                subtitle: '量子力学最著名的思想实验',
                objectives: [
                    '理解量子叠加态的概念',
                    '认识"观测"如何导致波函数坍缩',
                    '思考宏观与微观世界的界限',
                    '探讨量子测量问题的哲学含义'
                ],
                keyPoints: ['叠加态', '波函数坍缩', '观测效应', '放射性衰变', '50%概率'],
                tips: '点击箱子进行"观测"，看看猫究竟是死是活！每次观测结果都是随机的哦~'
            }
        },
        {
            id: 'tesseract',
            title: '四维超立方体',
            keywords: ['四维', '超立方体', 'tesseract', '维度', '高维空间', '4D', '五维', '六维', '正方体', '立方体'],
            type: 'scene',
            sceneClass: 'TesseractScene',
            icon: 'fa-cube',
            description: '从0维到高维的震撼演化之旅',
            difficulty: 4,
            intro: {
                subtitle: '挑战你的空间想象力',
                objectives: [
                    '理解维度递增的规律：点→线→面→体→...',
                    '掌握n维超立方体的顶点数公式：2ⁿ',
                    '观察四维空间在三维的投影',
                    '感受高维几何的数学之美'
                ],
                keyPoints: ['维度演化', '顶点数=2ⁿ', '4D旋转投影', '透视投影', '几何规律'],
                tips: '点击"自动演化"观看震撼的维度之旅，从一个点开始直到六维空间！'
            }
        },
        {
            id: 'maze',
            title: '迷宫寻路算法',
            keywords: ['迷宫', '寻路', 'A*', 'BFS', 'DFS', '路径', '导航', '算法', '右手法则', '水淹'],
            type: 'scene',
            sceneClass: 'MazeScene',
            icon: 'fa-route',
            description: '从右手法则到A*算法的进化',
            difficulty: 2,
            intro: {
                subtitle: '机器人迷宫比赛经典算法',
                objectives: [
                    '理解右手法则的简单思想',
                    '对比DFS"走到黑"和BFS"水淹"的区别',
                    '掌握A*算法的启发式搜索原理',
                    '直观感受不同算法的效率差异'
                ],
                keyPoints: ['右手法则', 'DFS深度优先', 'BFS水淹算法', 'A*启发搜索'],
                tips: '切换不同算法，观察机器人探索迷宫的方式和效率！'
            }
        },
        {
            id: 'kmeans',
            title: 'K-Means聚类算法',
            keywords: ['聚类', 'K-Means', '机器学习', '无监督学习', 'clustering', 'AI', '数据分析'],
            type: 'scene',
            sceneClass: 'KMeansScene',
            icon: 'fa-project-diagram',
            description: '"物以类聚"机器学习可视化',
            difficulty: 2,
            intro: {
                subtitle: '无监督学习经典算法',
                objectives: [
                    '理解聚类的概念：将相似数据分到一组',
                    '掌握K-Means算法的迭代过程',
                    '观察"分配-更新"两步交替进行',
                    '理解收敛条件和K值选择'
                ],
                keyPoints: ['初始化中心', '分配点', '更新中心', '迭代收敛'],
                tips: '观察彩色中心点如何移动到各自簇的"重心"位置！'
            }
        },
        {
            id: 'sorting',
            title: '排序算法可视化',
            keywords: ['排序', '冒泡', '快排', '归并', '选择排序', '插入排序', '算法', 'sort', 'bubble', 'quick', '编程'],
            type: 'scene',
            sceneClass: 'SortingScene',
            icon: 'fa-chart-bar',
            description: '不同排序算法效率对比动画',
            difficulty: 2,
            intro: {
                subtitle: '编程入门必备算法可视化',
                objectives: [
                    '理解不同排序算法的工作原理',
                    '直观感受O(n²)与O(n log n)的效率差异',
                    '观察比较次数和交换次数',
                    '掌握分治思想（快排、归并）'
                ],
                keyPoints: ['冒泡O(n²)', '选择O(n²)', '插入O(n²)', '快排O(n log n)', '归并O(n log n)'],
                tips: '选择不同算法，点击开始观察柱状图变化，比较效率差异！'
            }
        },
        {
            id: 'gradientdescent',
            title: '神经网络梯度下降',
            keywords: ['梯度下降', '梯度', '神经网络', '机器学习', 'AI', '损失函数', '优化', '学习率', 'gradient', 'descent', '深度学习'],
            type: 'scene',
            sceneClass: 'GradientDescentScene',
            icon: 'fa-chart-line',
            description: 'AI如何通过"下山"找到最优解',
            difficulty: 3,
            intro: {
                subtitle: '机器学习核心优化算法',
                objectives: [
                    '理解损失函数曲面的几何意义',
                    '掌握梯度的方向与大小含义',
                    '观察学习率对收敛速度的影响',
                    '了解局部最小值vs全局最小值'
                ],
                keyPoints: ['损失函数', '梯度∇L', '学习率α', 'θ_new = θ_old - α×∇L', '收敛'],
                tips: '调整学习率观察收敛变化，点击"自动下降"看小球如何滚向最优解！'
            }
        },
        {
            id: 'euler',
            title: '欧拉公式之美',
            keywords: ['欧拉', 'euler', '公式', 'e^iπ', '复数', '虚数', '单位圆', '最美公式', 'eiπ'],
            type: 'scene',
            sceneClass: 'EulerFormulaScene',
            icon: 'fa-infinity',
            description: 'e^(iπ) + 1 = 0 的几何意义',
            difficulty: 3,
            intro: {
                subtitle: '宇宙中最美的数学公式',
                objectives: [
                    '理解复平面和单位圆的概念',
                    '掌握 e^(iθ) = cos(θ) + i·sin(θ)',
                    '观察从 1 旋转到 -1 的过程（θ=0 到 θ=π）',
                    '领悟五个最重要数学常数的美妙联系'
                ],
                keyPoints: ['e^(iθ)', '单位圆', 'θ=π时到达-1', 'e·i·π·1·0'],
                tips: '拖动滑块控制θ值，或点击"旋转到π"观看完整旅程！'
            }
        },
        {
            id: 'klein',
            title: '克莱因瓶演变',
            keywords: ['克莱因瓶', 'klein', '莫比乌斯', 'mobius', '拓扑', '单面', '四维', '维度', '点线面'],
            type: 'scene',
            sceneClass: 'KleinBottleScene',
            icon: 'fa-flask',
            description: '从点到克莱因瓶的维度递进之旅',
            difficulty: 3,
            intro: {
                subtitle: '0维→1维→2维→单面→4D投影',
                objectives: [
                    '理解维度的概念：点→线→面→体',
                    '认识莫比乌斯带的单面性质',
                    '了解克莱因瓶的"无内外"特性',
                    '体验拓扑学的奇妙世界'
                ],
                keyPoints: ['维度递进', '莫比乌斯带', '单面曲面', '克莱因瓶', '4D投影'],
                tips: '点击"自动演化"观看从点到克莱因瓶的完整演变过程！'
            }
        },
        {
            id: 'orbital',
            title: '天体运动与卫星变轨',
            keywords: ['天体', '卫星', '变轨', '轨道', '开普勒', '万有引力', '同步卫星', '宇宙速度', '霍曼', '圆周运动', '近地', 'LEO', 'GEO'],
            type: 'scene',
            sceneClass: 'OrbitalMechanicsScene',
            icon: 'fa-satellite',
            description: '高考必考！卫星变轨与开普勒定律',
            difficulty: 3,
            intro: {
                subtitle: '从近地轨道到同步轨道的霍曼转移',
                objectives: [
                    '理解万有引力提供向心力的关系',
                    '掌握 v = √(GM/r)，轨道越高速度越慢',
                    '观察霍曼转移变轨过程：加速→升轨',
                    '区分三个宇宙速度的物理意义'
                ],
                keyPoints: ['v=√(GM/r)', '同步轨道', '霍曼转移', '开普勒定律', '三个宇宙速度'],
                tips: '点击"升至同步"观察卫星如何从近地轨道变轨到同步轨道！'
            }
        },
        {
            id: 'entanglement',
            title: '量子纠缠',
            keywords: ['量子纠缠', '纠缠', 'entanglement', 'EPR', '贝尔不等式', '超距作用', '量子通信', 'Alice', 'Bob', '自旋'],
            type: 'scene',
            sceneClass: 'QuantumEntanglementScene',
            icon: 'fa-link',
            description: '探索"幽灵般的超距作用"',
            difficulty: 4,
            intro: {
                subtitle: '爱因斯坦的"幽灵般超距作用"',
                objectives: [
                    '理解量子纠缠态的概念和数学表示',
                    '观察测量如何导致波函数坍缩',
                    '体验"测量A瞬间决定B"的神奇现象',
                    '了解量子纠缠在量子通信中的应用'
                ],
                keyPoints: ['纠缠态', '波函数坍缩', '非定域性', 'EPR佯谬', '量子通信'],
                tips: '点击"测量粒子A"观察两个粒子如何瞬间关联！'
            }
        },
        {
            id: 'fourier',
            title: '傅里叶变换',
            keywords: ['傅里叶', 'fourier', '频谱', '正弦波', '方波', '锯齿波', '谐波', '音乐', '信号'],
            type: 'scene',
            sceneClass: 'FourierScene',
            icon: 'fa-wave-square',
            description: '任何波形都是正弦波的叠加',
            difficulty: 3,
            intro: {
                subtitle: '万物皆可波',
                objectives: [
                    '理解傅里叶级数的核心思想',
                    '观察本轮(Epicycles)如何合成复杂波形',
                    '对比不同谐波数量对波形精度的影响',
                    '认识频谱分析的意义'
                ],
                keyPoints: ['正弦叠加', '本轮合成', '谐波', '频谱分析', '方波/锯齿波'],
                tips: '调整谐波数量，观察波形如何逼近理想形状！'
            }
        },
        {
            id: 'three-body',
            title: '三体问题',
            keywords: ['三体', '三体问题', '混沌', '天体', '引力', '庞加莱', '蝴蝶效应', '刘慈欣'],
            type: 'scene',
            sceneClass: 'ThreeBodyScene',
            icon: 'fa-sun',
            description: '三个恒星的引力舞蹈，混沌的起源',
            difficulty: 4,
            intro: {
                subtitle: '《三体》的科学背景',
                objectives: [
                    '理解三体问题为何无解析解',
                    '观察不同轨道配置（8字、拉格朗日、混沌）',
                    '体验蝴蝶效应：微小扰动导致完全不同结果',
                    '认识混沌系统的基本特征'
                ],
                keyPoints: ['万有引力', '无解析解', '混沌', '蝴蝶效应', '数值模拟'],
                tips: '尝试"微小扰动"按钮，观察蝴蝶效应如何改变轨道！'
            }
        },
        {
            id: 'mandelbrot',
            title: '曼德博分形',
            keywords: ['分形', '曼德博', 'mandelbrot', '朱利亚', 'julia', '自相似', '无限', '复数'],
            type: 'scene',
            sceneClass: 'MandelbrotScene',
            icon: 'fa-snowflake',
            description: '无限放大，永远有新细节',
            difficulty: 3,
            intro: {
                subtitle: '数学之美的极致体现',
                objectives: [
                    '理解迭代公式 z = z² + c 的含义',
                    '探索分形的自相似性',
                    '体验无限放大的神奇',
                    '认识复平面与分形的关系'
                ],
                keyPoints: ['复数迭代', '自相似性', '无限细节', '朱利亚集', '配色'],
                tips: '点击预设位置，探索分形的不同区域！'
            }
        },
        {
            id: 'dimensional-strike',
            title: '二向箔·降维打击',
            keywords: ['二向箔', '降维', '三体', '维度', '太阳系', '刘慈欣', '歌者', '清理'],
            type: 'scene',
            sceneClass: 'DimensionalStrikeScene',
            icon: 'fa-compress-alt',
            description: '《三体》终极武器的可视化',
            difficulty: 3,
            intro: {
                subtitle: '来自神级文明的终极武器',
                objectives: [
                    '理解维度的概念（0D→1D→2D→3D）',
                    '观察三维空间被压缩为二维的过程',
                    '体验《三体》中"降维打击"的震撼',
                    '思考维度与信息的关系'
                ],
                keyPoints: ['维度', '二向箔', '降维', '坍缩', '太阳系'],
                tips: '点击"释放二向箔"，见证降维打击的恐怖！'
            }
        },
        {
            id: 'boids',
            title: 'Boids群体智慧',
            keywords: ['boids', '群体', '鸟群', '鱼群', '涌现', '蜂群', '集群', '自组织'],
            type: 'scene',
            sceneClass: 'BoidsScene',
            icon: 'fa-crow',
            description: '没有领袖，却如此协调',
            difficulty: 2,
            intro: {
                subtitle: '三条简单规则 → 复杂群体行为',
                objectives: [
                    '理解Boids的三大规则：分离、对齐、聚合',
                    '观察简单规则如何产生复杂涌现行为',
                    '体验调整规则权重对群体行为的影响',
                    '认识自组织系统的基本原理'
                ],
                keyPoints: ['分离', '对齐', '聚合', '涌现', '自组织'],
                tips: '调整三大规则的权重，观察群体行为如何变化！'
            }
        },
        {
            id: 'doppler',
            title: '多普勒效应',
            keywords: ['多普勒', 'doppler', '救护车', '声波', '频率', '波长', '红移', '蓝移', '波'],
            type: 'scene',
            sceneClass: 'DopplerEffectScene',
            icon: 'fa-ambulance',
            description: '救护车声音为什么会变？',
            difficulty: 2,
            intro: {
                subtitle: '波动的压缩与拉伸',
                objectives: [
                    '理解波源运动如何改变观察者接收到的频率',
                    '观察波纹在前方被压缩、后方被拉伸',
                    '认识多普勒效应在雷达测速、医学超声中的应用',
                    '了解天文学中的红移与蓝移现象'
                ],
                keyPoints: ['波压缩', '波拉伸', '频率变化', '红移', '蓝移'],
                tips: '调整救护车速度，观察前后波纹的密度差异！'
            }
        },
        {
            id: 'entropy',
            title: '熵增定律',
            keywords: ['熵', '熵增', 'entropy', '热力学第二定律', '时间', '混乱', '有序', '无序', '时间箭头'],
            type: 'scene',
            sceneClass: 'EntropyScene',
            icon: 'fa-random',
            description: '时间为什么只能向前？',
            difficulty: 3,
            intro: {
                subtitle: '热力学第二定律可视化',
                objectives: [
                    '理解"熵"代表系统的混乱程度',
                    '观察封闭系统中熵只增不减的规律',
                    '认识熵增定律与"时间箭头"的关系',
                    '体会"打碎的杯子无法复原"的物理本质'
                ],
                keyPoints: ['熵', '混乱度', '有序→无序', '时间箭头', '不可逆'],
                tips: '点击"移除隔板"，观察红蓝粒子如何混合！尝试"逆转"看看能否恢复原状？'
            }
        },
        {
            id: 'traffic',
            title: '交通流与幽灵堵车',
            keywords: ['交通', '堵车', '幽灵堵车', '车流', '波动', '拥堵', '高速公路', '环形'],
            type: 'scene',
            sceneClass: 'TrafficFlowScene',
            icon: 'fa-car',
            description: '没有事故为什么也会堵车？',
            difficulty: 2,
            intro: {
                subtitle: '幽灵堵车现象可视化',
                objectives: [
                    '理解"幽灵堵车"是如何产生的',
                    '观察刹车波如何向后传播并放大',
                    '认识驾驶行为对交通流的影响',
                    '了解如何通过保持车距来避免堵车'
                ],
                keyPoints: ['幽灵堵车', '刹车波', '反向传播', '车距', '连锁反应'],
                tips: '点击"触发刹车"让某辆车减速，观察堵车波如何向后传播！'
            }
        },
        {
            id: 'golden-spiral',
            title: '黄金螺旋与斐波那契',
            keywords: ['黄金', '螺旋', '斐波那契', 'fibonacci', '黄金分割', 'φ', '1.618', '向日葵', '鹦鹉螺', '银河'],
            type: 'scene',
            sceneClass: 'GoldenSpiralScene',
            icon: 'fa-seedling',
            description: '自然界隐藏的数学密码',
            difficulty: 2,
            intro: {
                subtitle: '从斐波那契数列到自然之美',
                objectives: [
                    '理解斐波那契数列的生成规律',
                    '观察数列如何形成黄金螺旋',
                    '发现自然界中的黄金比例实例',
                    '体会数学与自然的神奇联系'
                ],
                keyPoints: ['斐波那契数列', '黄金比例φ≈1.618', '螺旋构建', '自然界应用'],
                tips: '点击"添加方块"逐步构建螺旋，然后叠加自然界图案！'
            }
        },
        {
            id: 'prisoners-dilemma',
            title: '囚徒困境',
            keywords: ['囚徒', '困境', '博弈', '博弈论', '纳什', '合作', '背叛', '收益', 'game theory'],
            type: 'scene',
            sceneClass: 'PrisonersDilemmaScene',
            icon: 'fa-user-friends',
            description: '为什么"理性"导致双输？',
            difficulty: 3,
            intro: {
                subtitle: '博弈论经典思想实验',
                objectives: [
                    '理解囚徒困境的基本设定',
                    '认识纳什均衡的概念',
                    '体验"理性选择"如何导致非最优结果',
                    '探索多轮博弈中合作如何涌现'
                ],
                keyPoints: ['收益矩阵', '纳什均衡', '合作vs背叛', '以牙还牙策略'],
                tips: '手动选择策略进行博弈，或观看AI策略对战！'
            }
        },
        {
            id: 'plato-cave',
            title: '柏拉图洞穴',
            keywords: ['柏拉图', '洞穴', '哲学', '影子', '真实', '认识论', '寓言', 'plato', 'cave'],
            type: 'scene',
            sceneClass: 'PlatoCaveScene',
            icon: 'fa-mountain',
            description: '你看到的是真实还是影子？',
            difficulty: 3,
            intro: {
                subtitle: '哲学史上最著名的寓言',
                objectives: [
                    '理解柏拉图洞穴寓言的核心内容',
                    '体验囚徒视角与旁观者视角的差异',
                    '思考"我们看到的是否是真实"',
                    '了解认识论的基本问题'
                ],
                keyPoints: ['影子', '火把', '解放', '真实世界', '认识论'],
                tips: '切换不同视角，体验从影子到真相的认知升级！'
            }
        },
        {
            id: 'lorenz',
            title: '蝴蝶效应与洛伦兹吸引子',
            keywords: ['蝴蝶效应', '洛伦兹', 'lorenz', '混沌', '吸引子', '天气', '预测', '敏感依赖'],
            type: 'scene',
            sceneClass: 'LorenzAttractorScene',
            icon: 'fa-butterfly',
            description: '一只蝴蝶扇动翅膀，能引发风暴',
            difficulty: 3,
            intro: {
                subtitle: '混沌理论的起源',
                objectives: [
                    '理解洛伦兹方程如何产生"蝴蝶"形轨迹',
                    '观察初始条件的微小差异如何导致完全不同结果',
                    '认识"确定性混沌"的概念',
                    '了解为什么天气预报无法长期准确'
                ],
                keyPoints: ['洛伦兹方程', '敏感依赖', '混沌', '吸引子', '不可预测'],
                tips: '点击"添加对比粒子"观察两条轨迹如何分离！初始差距仅0.0001！'
            }
        },
        {
            id: 'game-of-life',
            title: '生命游戏',
            keywords: ['生命游戏', 'game of life', '元胞自动机', 'Conway', '涌现', '滑翔机', '自动机'],
            type: 'scene',
            sceneClass: 'GameOfLifeScene',
            icon: 'fa-th',
            description: '4条简单规则创造生命的复杂性',
            difficulty: 2,
            intro: {
                subtitle: 'Conway\'s Game of Life',
                objectives: [
                    '理解4条简单规则：孤独死、拥挤死、繁殖、存活',
                    '观察简单规则如何产生复杂的涌现行为',
                    '认识经典图案：滑翔机、振荡器、脉冲星',
                    '了解元胞自动机是图灵完备的'
                ],
                keyPoints: ['邻居数', '孤独死', '拥挤死', '繁殖', '涌现'],
                tips: '选择预设图案或随机生成，点击开始观察生命演化！'
            }
        },
        {
            id: 'six-degrees',
            title: '六度分隔理论',
            keywords: ['六度分隔', '六度', 'six degrees', '社交网络', '小世界', '弱连接', '米尔格拉姆'],
            type: 'scene',
            sceneClass: 'SixDegreesScene',
            icon: 'fa-project-diagram',
            description: '你和任何人最多6步就能联系',
            difficulty: 2,
            intro: {
                subtitle: 'Small World Network',
                objectives: [
                    '理解六度分隔理论的核心内容',
                    '观察社交网络中的"簇"结构',
                    '认识"弱连接"在网络中的桥梁作用',
                    '亲手验证任意两点的最短路径'
                ],
                keyPoints: ['小世界网络', '弱连接', '最短路径', '社交图谱', '6步联系'],
                tips: '点击任意两个节点，查看最短连接路径！橙色线是重要的弱连接'
            }
        },
        {
            id: 'herd-behavior',
            title: '羊群效应',
            keywords: ['羊群效应', '从众', '羊群', 'herd', '跟风', '信息级联', 'Asch', '社会心理'],
            type: 'scene',
            sceneClass: 'HerdBehaviorScene',
            icon: 'fa-users',
            description: '为什么大多数人只是在跟随，不是在思考？',
            difficulty: 2,
            intro: {
                subtitle: '信息级联与从众心理',
                objectives: [
                    '理解"信息级联"如何导致集体错误',
                    '观察少数知情者如何影响多数人',
                    '认识从众强度对结果的影响',
                    '思考独立思考的重要性'
                ],
                keyPoints: ['从众心理', '信息级联', '知情者', '集体错误', '独立思考'],
                tips: '调整知情者比例和从众倾向，观察结果如何变化！'
            }
        },
        {
            id: 'compound-interest',
            title: '复利效应',
            keywords: ['复利', '利息', '投资', '72法则', '理财', '时间', '财富', '增长', 'compound'],
            type: 'scene',
            sceneClass: 'CompoundInterestScene',
            icon: 'fa-chart-line',
            description: '时间的力量：早投资10年，结果差10倍',
            difficulty: 1,
            intro: {
                subtitle: '世界第八大奇迹',
                objectives: [
                    '理解复利与单利的本质区别',
                    '掌握72法则：翻倍年数 ≈ 72/利率',
                    '直观感受时间对财富增长的影响',
                    '认识"复利的力量"对人生的意义'
                ],
                keyPoints: ['A=P(1+r)^t', '72法则', '复利vs单利', '时间价值', '指数增长'],
                tips: '调整利率和年限，观察复利曲线如何拉开差距！'
            }
        },
        {
            id: 'tragedy-of-commons',
            title: '公地悲剧',
            keywords: ['公地悲剧', '公地', 'commons', '过度开发', '资源', '环境', '可持续', '博弈'],
            type: 'scene',
            sceneClass: 'TragedyOfCommonsScene',
            icon: 'fa-seedling',
            description: '每个人的理性选择导致集体的灾难',
            difficulty: 2,
            intro: {
                subtitle: '共享资源的过度开发',
                objectives: [
                    '理解公地悲剧的核心逻辑',
                    '观察个体理性与集体理性的冲突',
                    '认识"外部性"概念',
                    '思考环境保护的经济学基础'
                ],
                keyPoints: ['共享资源', '个体理性', '集体非理性', '可持续性', '外部性'],
                tips: '调整牧民数量和贪婪程度，观察草地如何退化！'
            }
        },
        {
            id: 'husky-battle',
            title: '双犬奇缘',
            keywords: ['游戏', '哈士奇', '战斗', '魂系', '动作', 'game', '狗', '弹反'],
            type: 'scene',
            sceneClass: 'HuskyBattleScene',
            icon: 'fa-gamepad',
            description: '🎮 可玩游戏！击败神秘的连体哈士奇',
            difficulty: 3,
            intro: {
                subtitle: '类魂系第一人称战斗游戏',
                objectives: [
                    '阶段1：用石头攻击分离两只连体狗狗',
                    '阶段2：与分离的狗狗战斗并击败它们',
                    '掌握弹反时机反弹伤害',
                    '合理使用翻滚闪避致命攻击'
                ],
                keyPoints: ['WASD移动', '鼠标瞄准', '左键攻击', 'Q弹反', '空格翻滚'],
                tips: '先用石头攻击头部（2次）或身体（5次）让狗狗分离！'
            }
        },
        {
            id: 'geometry-problem',
            title: '几何解题可视化',
            keywords: ['几何', '三角形', '面积', '最大值', '圆', '动点', '解题', '数学'],
            type: 'scene',
            sceneClass: 'GeometryProblemScene',
            icon: 'fa-drafting-compass',
            description: '📐 动点问题：求三角形面积之和最大值',
            difficulty: 3,
            intro: {
                subtitle: '动点轨迹与面积最大值问题',
                objectives: [
                    '理解动点在圆上运动时图形的变化',
                    '掌握面积等量转化的技巧',
                    '发现"对角线⊥时面积最大"的规律',
                    '体验几何问题的辅助线构造思路'
                ],
                keyPoints: ['动点轨迹', '面积转化', '辅助线', '对角线⊥'],
                tips: '拖动红色点C观察面积变化，点击"解题步骤"跟随老师思路！'
            }
        },
        {
            id: 'solid-geometry',
            title: '正方体截面问题',
            keywords: ['立体几何', '正方体', '截面', '六边形', '空间想象', '截面构造', '三维', '立体'],
            type: 'scene',
            sceneClass: 'SolidGeometryScene',
            icon: 'fa-cube',
            description: '🎲 立体几何：探索正方体的截面形状与面积',
            difficulty: 3,
            intro: {
                subtitle: '正方体截面问题探究',
                objectives: [
                    '理解正方体的顶点、棱和面结构',
                    '探索截面可能是什么形状（三角形→六边形）',
                    '掌握"平面最多与6个面相交"的规律',
                    '找到最大截面（正六边形）的位置'
                ],
                keyPoints: ['截面形状', '顶点连线', '面积计算', '正六边形'],
                tips: '拖动绿色控制点调整截面位置，点击"最大六边形"查看最大截面！'
            }
        },
        {
            id: 'smartmine',
            title: '智慧煤矿数字孪生',
            keywords: ['煤矿', '智慧矿山', '安全监测', '瓦斯', '数字孪生', '生产调度', '矿山', 'mine', '采煤'],
            type: 'scene',
            sceneClass: 'SmartMineScene',
            icon: 'fa-mountain',
            description: '🏭 企业级煤矿安全监测与生产调度3D可视化',
            difficulty: 4,
            intro: {
                subtitle: '煤矿数字孪生系统演示',
                objectives: [
                    '了解智慧矿山的整体架构',
                    '认识安全监测系统（瓦斯、人员定位）',
                    '理解生产调度数据可视化',
                    '体验瓦斯超限报警流程'
                ],
                keyPoints: ['数字孪生', '安全监测', '生产调度', '瓦斯报警', '人员定位'],
                tips: '切换视角查看地表/井下，点击设施查看详情，尝试"报警演示"！'
            }
        },
        {
            id: 'grade7-cell-mount',
            title: '观察植物和动物细胞',
            keywords: ['细胞', '洋葱内表皮', '黑藻', '人口腔', '盖玻片', '装片', '七年级细胞'],
            type: 'scene',
            sceneClass: 'Grade7CellMountScene',
            icon: 'fa-microscope',
            description: '薄而透明的材料才能看清细胞',
            difficulty: 1,
            intro: {
                subtitle: '七年级：制作并观察临时装片',
                objectives: [
                    '知道整片叶子太厚，光线穿不过去',
                    '比较洋葱内表皮、黑藻叶片和人口腔上皮细胞',
                    '练习一侧先接触液滴放下盖玻片'
                ],
                keyPoints: ['细胞壁', '细胞膜', '细胞质', '细胞核', '线粒体', '液泡', '叶绿体', 'DNA'],
                tips: '叶绿体只在绿色部分。碘液只让洋葱内表皮的核更清楚。'
            }
        },
        {
            id: 'grade7-microscope',
            title: '练习使用显微镜',
            keywords: ['显微镜', '目镜', '物镜', '粗准焦', '细准焦', '高倍镜'],
            type: 'scene',
            sceneClass: 'Grade7MicroscopeScene',
            icon: 'fa-search',
            description: '放大倍数是目镜和物镜的乘积',
            difficulty: 1,
            intro: {
                subtitle: '七年级：单目和双目显微镜的调焦',
                objectives: [
                    '用目镜倍数乘物镜倍数读出放大倍数',
                    '高倍镜下看到的细胞更大、更少',
                    '下降镜筒或上升载物台时先从侧面看'
                ],
                keyPoints: ['10×目镜', '4× 10× 40×', '粗准焦螺旋', '细准焦螺旋'],
                tips: '换成高倍物镜后，粗准焦螺旋停用，只转细准焦螺旋。'
            }
        },
        {
            id: 'grade7-life-test',
            title: '生物有哪些特征',
            keywords: ['生石花', '钟乳石', '含羞草', '生物特征', '七年级生物'],
            type: 'scene',
            sceneClass: 'Grade7LifeTestScene',
            icon: 'fa-leaf',
            description: '一次只测一项生命特征',
            difficulty: 1,
            intro: {
                subtitle: '七年级：用五项特征辨认生物',
                objectives: [
                    '逐项判断是否由细胞构成、需要营养、排出废物、对刺激作出反应、生长和繁殖',
                    '区分钟乳石变长和生物生长',
                    '知道病毒是生物，但没有细胞，也不能独立完成生命活动'
                ],
                keyPoints: ['细胞', '营养', '废物', '刺激', '繁殖', '病毒'],
                tips: '机器人能移动，但不是由细胞构成的，也不取食、不繁殖。'
            }
        },
        {
            id: 'grade7-dolly',
            title: '多莉为什么像B羊',
            keywords: ['多莉', '克隆羊', '乳腺细胞', '去核卵', '代孕'],
            type: 'scene',
            sceneClass: 'Grade7DollyScene',
            icon: 'fa-paw',
            description: '完整乳腺细胞与去核卵细胞融合',
            difficulty: 2,
            intro: {
                subtitle: '七年级：细胞核里有指导发育的信息',
                objectives: [
                    '分清A羊的去核卵细胞、B羊的完整乳腺细胞和C羊的代孕',
                    '看到融合的是完整细胞，不是单独注射细胞核',
                    '知道多莉长得像B羊'
                ],
                keyPoints: ['去核卵细胞', '完整乳腺细胞', '代孕', '遗传信息'],
                tips: '遗传信息的结构怎样、怎样起作用，以后再学。'
            }
        },
        {
            id: 'grade7-division',
            title: '细胞怎样分成两个',
            keywords: ['细胞分裂', '染色体', '缢缩', '根尖', '新细胞壁'],
            type: 'scene',
            sceneClass: 'Grade7DivisionScene',
            icon: 'fa-clone',
            description: '染色体复制后再分成两组',
            difficulty: 1,
            intro: {
                subtitle: '七年级：植物细胞和动物细胞的分裂',
                objectives: [
                    '按复制、分成两组、形成两个细胞核、细胞质分开的顺序观察',
                    '比较植物细胞长出新壁和动物细胞膜向内缢缩',
                    '知道新细胞的染色体与亲代细胞相同'
                ],
                keyPoints: ['染色体', '细胞核', '细胞壁', '细胞膜'],
                tips: '这里不讲分裂期的名称。'
            }
        },
        {
            id: 'grade7-paramecium',
            title: '草履虫的趋性',
            keywords: ['草履虫', '肉汁', '食盐', '棉花纤维', '纤毛'],
            type: 'scene',
            sceneClass: 'Grade7ParameciumScene',
            icon: 'fa-water',
            description: '远离食盐，游向肉汁',
            difficulty: 1,
            intro: {
                subtitle: '七年级：两滴培养液之间的窄通道',
                objectives: [
                    '看草履虫怎样离开左滴边缘的小盐粒',
                    '看它们怎样游向右滴边缘的肉汁',
                    '前方碰到棉花纤维时后退并转向'
                ],
                keyPoints: ['纤毛', '口沟', '食物泡', '表膜', '伸缩泡'],
                tips: '盐粒太大或放在中央时，课本没有给出结果。草履虫没有神经。'
            }
        },
        {
            id: 'grade7-seed',
            title: '菜豆、玉米和孢子',
            keywords: ['菜豆', '玉米粒', '胚乳', '子叶', '孢子'],
            type: 'scene',
            sceneClass: 'Grade7SeedScene',
            icon: 'fa-seedling',
            description: '菜豆没有胚乳，玉米粒其实是果实',
            difficulty: 1,
            intro: {
                subtitle: '七年级：种子的结构和孢子的差别',
                objectives: [
                    '认出菜豆的种皮、两片子叶、胚芽、胚轴和胚根',
                    '知道玉米粒的果皮和种皮长在一起，碘液可检测子叶或胚乳中的淀粉',
                    '比较种子与孢子的结构，认识萌发需要适宜条件，耐受性因种类而异'
                ],
                keyPoints: ['胚', '子叶', '胚乳', '孢子', '淀粉'],
                tips: '胚是胚芽、胚轴、胚根和子叶。胚乳不是胚。'
            }
        },
        {
            id: 'grade7-fish-gill',
            title: '鱼怎样用鳃呼吸',
            keywords: ['鳃丝', '鳃盖', '鱼鳍', '侧线', '鲫鱼'],
            type: 'scene',
            sceneClass: 'Grade7FishGillScene',
            icon: 'fa-fish',
            description: '水从口入，从鳃盖后缘流出',
            difficulty: 1,
            intro: {
                subtitle: '七年级：鳃丝与水流',
                objectives: [
                    '看口和鳃盖交替开合',
                    '用墨水看水经过鳃',
                    '观察离开水面后鳃丝粘成一团、游动停止'
                ],
                keyPoints: ['鳃丝', '鳃盖', '胸鳍', '尾鳍', '侧线'],
                tips: '水中的氧进入血液，二氧化碳随水排出。这里不讲鱼的繁殖。'
            }
        },
        {
            id: 'grade7-classify',
            title: '尝试把生物分类',
            keywords: ['油松', '葫芦藓', '分类等级', '犬属', '七年级分类'],
            type: 'scene',
            sceneClass: 'Grade7ClassifyScene',
            icon: 'fa-sitemap',
            description: '从有没有种子，到狼的分类等级',
            difficulty: 2,
            intro: {
                subtitle: '七年级：植物、动物和从种到界',
                objectives: [
                    '按有没有种子、花和果实、子叶和叶脉给植物分格',
                    '按有没有脊柱给动物分格',
                    '按从种到界的顺序看狼的分类'
                ],
                keyPoints: ['裸子', '被子', '单子叶', '双子叶', '脊柱', '种'],
                tips: '种是分类的基本单位。葫芦藓没有真正的根、茎、叶。'
            }
        },
        {
            id: 'grade7-campus',
            title: '观察周边的生物',
            keywords: ['毛白杨', '垂柳', '光叶子花', '三角梅', '校园观察'],
            type: 'scene',
            sceneClass: 'Grade7CampusScene',
            icon: 'fa-binoculars',
            description: '有目的地比较植物的形态和生活环境',
            difficulty: 1,
            intro: {
                subtitle: '七年级：观察要有目的、有计划',
                objectives: [
                    '从树干、枝条、叶、花和生活环境比较毛白杨和垂柳',
                    '看光叶子花时，先别认定紫色部分就是花瓣',
                    '记录观察目的，不破坏植物'
                ],
                keyPoints: ['观察', '比较', '形态', '生活环境'],
                tips: '画面是示意图，不能代替到校园里去看。'
            }
        },
        {
            id: 'grade7-cell-life',
            title: '细胞的生活',
            keywords: ['能量转换器', '细胞膜控制', '细胞的生活', '分泌物', '光合作用', '叶绿体', '线粒体', '细胞核', 'DNA'],
            type: 'scene',
            sceneClass: 'Grade7CellLifeScene',
            icon: 'fa-bolt',
            description: '物质进出、能量转换和细胞核',
            difficulty: 1,
            intro: {
                subtitle: '七年级：细胞膜、叶绿体、线粒体和细胞核',
                objectives: [
                    '看需要的物质进入，有些物质被挡住，废物和分泌物排出',
                    '区分叶绿体贮存能量和线粒体释放能量',
                    '知道遗传信息主要在细胞核里'
                ],
                keyPoints: ['细胞膜', '叶绿体', '线粒体', '细胞核', 'DNA'],
                tips: '能量不会凭空产生。DNA 的结构以后再学。'
            }
        },
        {
            id: 'grade7-animal-levels',
            title: '动物体的结构层次',
            keywords: ['上皮组织', '结缔组织', '消化系统', '结构层次'],
            type: 'scene',
            sceneClass: 'Grade7AnimalLevelsScene',
            icon: 'fa-user',
            description: '细胞、组织、器官、系统、个体',
            difficulty: 2,
            intro: {
                subtitle: '七年级：人体的四种基本组织',
                objectives: [
                    '认出上皮、肌肉、结缔和神经四种组织',
                    '看胃怎样由几种组织按次序构成',
                    '知道系统既有分工又互相配合'
                ],
                keyPoints: ['组织', '器官', '系统', '个体'],
                tips: '绿色开花植物没有“系统”这一层。'
            }
        },
        {
            id: 'grade7-plant-levels',
            title: '植物体的结构层次',
            keywords: ['分生组织', '输导组织', '筛管', '油菜', '六大器官'],
            type: 'scene',
            sceneClass: 'Grade7PlantLevelsScene',
            icon: 'fa-spa',
            description: '六大器官和五种组织',
            difficulty: 2,
            intro: {
                subtitle: '七年级：绿色开花植物没有系统',
                objectives: [
                    '指出根、茎、叶、花、果实、种子',
                    '区分分生、保护、机械、输导和薄壁组织',
                    '知道藕是茎，树皮里的筛管不能大面积切断'
                ],
                keyPoints: ['营养器官', '生殖器官', '导管', '筛管', '分生组织'],
                tips: '掐去顶端，是去掉了那里能不断分裂的分生组织。'
            }
        },
        {
            id: 'grade7-plant-groups',
            title: '藻类、苔藓、蕨类和种子植物',
            keywords: ['水绵', '葫芦藓', '肾蕨', '裸子植物', '被子植物'],
            type: 'scene',
            sceneClass: 'Grade7PlantGroupsScene',
            icon: 'fa-tree',
            description: '从没有根茎叶，到种子包在果实里',
            difficulty: 2,
            intro: {
                subtitle: '七年级：植物类群的主要差别',
                objectives: [
                    '说明藻类没有根、茎、叶的分化',
                    '区别葫芦藓的假根和肾蕨真正的根、茎、叶',
                    '知道松的球果不是果实，水稻的种子在果实里'
                ],
                keyPoints: ['孢子', '假根', '输导组织', '裸子植物', '被子植物'],
                tips: '孢子只有一个细胞，离开温暖潮湿很快失去生命力。'
            }
        },
        {
            id: 'grade7-invertebrate',
            title: '无脊椎动物',
            keywords: ['刺胞动物', '涡虫', '蛔虫', '节肢动物', '软体动物', '海星'],
            type: 'scene',
            sceneClass: 'Grade7InvertebrateScene',
            icon: 'fa-bug',
            description: '水螅、涡虫、蛔虫、蚯蚓、蝗虫、蜗牛和海星',
            difficulty: 2,
            intro: {
                subtitle: '七年级：体内没有脊柱的动物',
                objectives: [
                    '用刺细胞、体形、分节和外骨骼区分主要类群',
                    '比较辐射对称和两侧对称',
                    '知道软体动物大多有贝壳，棘皮动物生活在海里'
                ],
                keyPoints: ['刺胞动物', '扁形动物', '线虫动物', '环节动物', '节肢动物'],
                tips: '蝗虫的外骨骼要蜕掉，身体才能长大。'
            }
        },
        {
            id: 'grade7-amphibian',
            title: '两栖动物和爬行动物',
            keywords: ['两栖动物', '蝌蚪', '蜥蜴', '扬子鳄', '蟾蜍'],
            type: 'scene',
            sceneClass: 'Grade7AmphibianScene',
            icon: 'fa-frog',
            description: '幼体用鳃，成体用肺；爬行动物真正适应陆地',
            difficulty: 2,
            intro: {
                subtitle: '七年级：青蛙和蜥蜴为什么不是同一类',
                objectives: [
                    '看蝌蚪的尾和鳃怎样变成成蛙的四肢和肺',
                    '知道青蛙皮肤可以辅助呼吸，蜥蜴主要靠肺',
                    '思考蛇没有四肢为什么仍可能是爬行动物'
                ],
                keyPoints: ['鳃', '肺', '皮肤', '陆地卵'],
                tips: '判断爬行动物，不看它有没有四肢。'
            }
        },
        {
            id: 'grade7-bird-mammal',
            title: '鸟和哺乳动物',
            keywords: ['气囊', '恒温动物', '胎生', '门齿', '犬齿'],
            type: 'scene',
            sceneClass: 'Grade7BirdMammalScene',
            icon: 'fa-dove',
            description: '羽毛、气囊、体毛、胎生和牙齿分化',
            difficulty: 2,
            intro: {
                subtitle: '七年级：恒定体温的两类脊椎动物',
                objectives: [
                    '看鸟的翼、喙和气囊怎样帮助飞行和呼吸',
                    '比较兔和狼的牙齿',
                    '知道鲸的毛少了，仍然是哺乳动物'
                ],
                keyPoints: ['气囊', '恒温', '胎生', '哺乳', '牙齿分化'],
                tips: '鱼、两栖动物和爬行动物的体温会随环境改变。'
            }
        },
        {
            id: 'grade7-cell-model',
            title: '制作细胞模型',
            keywords: ['细胞模型', '彩泥', '科学性', '临时装片模型'],
            type: 'scene',
            sceneClass: 'Grade7CellModelScene',
            icon: 'fa-cubes',
            description: '只拼这册书要求的细胞结构',
            difficulty: 1,
            intro: {
                subtitle: '七年级综合实践：细胞模型',
                objectives: [
                    '按动物细胞、非绿色植物细胞或绿色植物细胞来拼',
                    '叶绿体只放进绿色细胞',
                    '用科学性检查模型是否完整'
                ],
                keyPoints: ['细胞壁', '叶绿体', '液泡', '线粒体', '细胞核'],
                tips: '这册书不要求内质网、高尔基体和核糖体。'
            }
        },
        {
            id: 'grade7-microbe-lab',
            title: '检测细菌和真菌',
            keywords: ['菌落', '培养基', '高温灭菌', '无菌棉签', '琼脂'],
            type: 'scene',
            sceneClass: 'Grade7MicrobeLabScene',
            icon: 'fa-vial',
            description: '灭菌、接种，并用一个不打开的皿作对照',
            difficulty: 2,
            intro: {
                subtitle: '七年级：微生物分布在哪里',
                objectives: [
                    '按配制、灭菌、冷却、接种、培养的顺序操作',
                    '比较细菌菌落和霉菌菌落的样子',
                    '看到跳过灭菌后对照皿也会长菌'
                ],
                keyPoints: ['菌落', '琼脂', '接种', '对照'],
                tips: '培养物不能摸、不能尝。结束时再次灭菌。'
            }
        },
        {
            id: 'grade7-bacteria',
            title: '细菌',
            keywords: ['细菌', '球菌', '杆菌', '螺旋菌', '芽孢', '原核生物', '鞭毛'],
            type: 'scene',
            sceneClass: 'Grade7BacteriaScene',
            icon: 'fa-bacterium',
            description: '没有成形的细胞核，靠分裂生殖',
            difficulty: 2,
            intro: {
                subtitle: '七年级：细菌的形态、结构和生殖',
                objectives: [
                    '认出球菌、杆菌和螺旋菌',
                    '指出细胞壁、细胞膜、细胞质和 DNA 区域',
                    '分清芽孢是休眠，分裂才是生殖'
                ],
                keyPoints: ['细胞壁', 'DNA', '荚膜', '鞭毛', '芽孢', '分裂'],
                tips: '大多数细菌不能进行光合作用。荚膜和鞭毛不是每种都有。'
            }
        },
        {
            id: 'grade7-fungus',
            title: '真菌',
            keywords: ['酵母菌', '青霉', '气生菌丝', '出芽生殖', '木耳'],
            type: 'scene',
            sceneClass: 'Grade7FungusScene',
            icon: 'fa-seedling',
            description: '酵母出芽，青霉用菌丝吸收有机物',
            difficulty: 2,
            intro: {
                subtitle: '七年级：有成形细胞核的真菌',
                objectives: [
                    '看酵母菌出芽，并用碘液染出细胞核',
                    '区分气生菌丝和营养菌丝',
                    '戴好手套、口罩和护目镜再打开培养皿'
                ],
                keyPoints: ['细胞壁', '细胞核', '菌丝', '孢子', '真核生物'],
                tips: '真菌没有叶绿体。看完青霉要灭菌，不能品尝。'
            }
        },
        {
            id: 'grade7-virus',
            title: '病毒没有细胞结构',
            keywords: ['病毒', '噬菌体', '烟草花叶', '蛋白质外壳', '动物病毒'],
            type: 'scene',
            sceneClass: 'Grade7VirusScene',
            icon: 'fa-virus',
            description: '蛋白质外壳加内部的遗传物质',
            difficulty: 2,
            intro: {
                subtitle: '七年级：病毒必须寄生在活细胞里',
                objectives: [
                    '比较动物病毒、植物病毒和噬菌体',
                    '看到细胞外的病毒颗粒不能继续活动',
                    '知道它利用宿主细胞里的物质制造新病毒'
                ],
                keyPoints: ['蛋白质外壳', '遗传物质', '寄生', '活细胞'],
                tips: '病毒比细胞小得多，大小用纳米表示。这里不给具体数字。'
            }
        },
        {
            id: 'grade7-ferment',
            title: '制作发酵食品',
            keywords: ['发酵食品', '酸奶', '泡菜', '馒头', '乳酸菌'],
            type: 'scene',
            sceneClass: 'Grade7FermentScene',
            icon: 'fa-bread-slice',
            description: '乳酸菌和酵母菌在盖严的容器里工作',
            difficulty: 1,
            intro: {
                subtitle: '七年级综合实践：发酵食品',
                objectives: [
                    '看乳酸菌怎样把牛奶和蔬菜变成酸奶、泡菜',
                    '看酵母菌产生的气体怎样使面团胀起',
                    '确认老师或家长允许之后才品尝'
                ],
                keyPoints: ['乳酸菌', '酵母菌', '二氧化碳', '密闭'],
                tips: '未知培养皿和发霉的橘子都不是可以品尝的食物。'
            }
        },
        {
            id: 'ppt',
            title: '注意力机制课件',
            keywords: ['ppt', '原理', '课件', '幻灯片', '讲解'],
            type: 'ppt',
            sceneClass: null,
            icon: 'fa-chalkboard-teacher',
            description: '从词向量到注意力机制的完整讲解',
            difficulty: 3,
            intro: null // PPT不需要介绍模态框
        }
    ],

    /**
     * 根据用户输入匹配案例
     */
    matchCase(text) {
        const lowerText = text.toLowerCase();
        let best = null;
        let bestLen = 0;

        for (const c of this.CASES) {
            for (const kw of c.keywords) {
                const key = kw.toLowerCase();
                if (key && lowerText.includes(key) && key.length > bestLen) {
                    best = c;
                    bestLen = key.length;
                }
            }
        }

        return best;
    },

    /**
     * 获取案例的场景类
     */
    getSceneClass(caseId) {
        const c = this.CASES.find(item => item.id === caseId);
        if (c && c.sceneClass && window[c.sceneClass]) {
            return window[c.sceneClass];
        }
        return null;
    },

    /**
     * 获取案例介绍信息
     */
    getIntro(caseId) {
        const c = this.CASES.find(item => item.id === caseId);
        if (c && c.intro) {
            return {
                title: c.title,
                icon: c.icon,
                ...c.intro
            };
        }
        return null;
    },

    /**
     * 获取案例列表（用于欢迎消息）
     */
    getWelcomeList() {
        return this.CASES.map((c) => 
            `<span class="inline-block"><i class="fas ${c.icon} mr-1 text-blue-400"></i><b>${c.title.split('(')[0].trim()}</b></span>`
        ).join(' · ');
    }
};
