/* Source-checked engineering reading. No hardware connection, executable vendor code, or progress migration. */
window.SensorCases = [
  {
    id: 'ti-tipd120', maker: 'TI', title: '三线 RTD：先消掉失配，再谈标定',
    subtitle: 'TIPD120 · 比率测量 / 电流换向 / 精密电阻台架',
    question: '为什么用了 24 位 ADC，仍然要交换两路激励电流？',
    summary: '把共模漂移、引线误差、标定残差和真实温度误差分开验收。',
    published: '2013-12', revision: 'SLAU520A · 2014-11 修订', verified: '2026-10-17',
    evidence: '厂商参考设计 + 精密电阻台架实测', reproduction: '未本站实物复现', status: '待学习',
    lessons: ['reference', 'calibration', 'adc'],
    conditions: 'ADS1247；AVDD/DVDD 3.3 V；双路 IDAC 各 1 mA；PGA ×4；20 SPS；RREF 820 Ω。原文给出寄存器配置与 chopping 方法，未给出可锁定的测试固件版本或哈希。',
    sources: [
      {id:'report', label:'TI SLAU520A · §§3、6 / pp.8–10、22–26', url:'https://www.ti.com/lit/pdf/SLAU520', date:'首发 2013-12；修订 2014-11（PDF 页脚）'},
      {id:'design', label:'TI TIPD120 · 参考设计与设计文件', url:'https://www.ti.com/tool/TIPD120', date:'页面列出的文档日期与 PDF 页脚不同；本文版本以 PDF 为准'}
    ],
    blocks: [
      {label:'01 / THE REAL CONSTRAINT', title:'三根线省成本，也引入匹配条件', paragraphs:[
        '厂商方案：ADS1247 把 PGA、ADC、复用器和两路电流源集成起来。输入与参考采用比率结构；交换两路 IDAC 后分别测量、取平均，减轻电流失配。TI 还提示，输入与参考的差分滤波应匹配。',
        '本站分析：比率结构首先处理共同变化；三线引线补偿还有“对应引线足够匹配”的前提。电流更大能提高信号幅度，却会增加自热，也可能耗尽电流源和 PGA 的电压余量。不能把这几类误差一起交给一次数字标定。'
      ], sourceIds:['design','report']},
      {label:'02 / WHAT WAS MEASURED', title:'测的是采集电路，不是整个温度系统', paragraphs:[
        '厂商实测：§6.1 用校准过的精密电阻代替 RTD，覆盖 20–400 Ω；增益/偏移校正后，报告最大电阻误差 ±0.00415 Ω。§6.2 在 220 Ω 下记录 1,000 点，峰峰噪声约 3.45 µV。',
        '本站判断：这证明了该台架的电路表现，不能覆盖探头公差、自热、热接触、滞后与真实环境温漂。原文未给出可供本站复核的逐点原始数据，也未在此段明确独立留出验证集；不要把拟合后的曲线直接当作独立验收。'
      ], sourceIds:['report']},
      {label:'03 / CALCULATE, DO NOT CLAIM', title:'把电阻残差换成温度，要写明工作点', formula:'0.00415 Ω ÷ 0.39083 Ω/°C ≈ 0.0106 °C\nP = I²R：1 mA、100 Ω 时，探头耗散 0.1 mW', paragraphs:[
        '理论换算：第一式使用 Pt100 在 0 °C 附近的灵敏度，复核原文式 (49)，不是全温区实测温差。第二式只算电功率；没有探头散热系数和安装条件，不能由 0.1 mW 推出自热温升。',
        '可迁移方法：先以电阻标准隔离电路问题，再接探头验证热学问题。换成其他 ADC、Pt1000 或更长电缆时，应重新核算参考、输入共模、激励余量、滤波和完整成对测量的耗时，不能照搬 20 SPS 为最终刷新率。'
      ], sourceIds:['report']},
      {label:'04 / BENCH ACCEPTANCE', title:'待执行的台架验收清单', paragraphs:['以下为本站建议，尚未执行。仅用于已确认安全隔离的低压台架；换接电阻和探头前断电，先按器件额定值核对连接。'], bullets:[
        '冻结记录：板卡版本、寄存器、供电、室温、参考电阻实测值和标准器不确定度；保留未标定原始码。',
        '在低、中、高电阻点比较“不交换 / 成对交换”。每次换向后等待规定的模拟与数字滤波建立，标记有效样本，不把旧码混进新相位。',
        '另选未参与拟合的电阻点，报告最大绝对残差、重复性、样本数和刷新延迟。门限来自应用误差预算，不直接照抄厂商最佳结果。',
        '最后连接实际探头，改变激励电流、引线和安装介质；检查残差是否随之变化。电阻台架通过、探头不通过时，继续查自热与热耦合。'
      ]},
      {label:'05 / BEFORE YOU REUSE', title:'什么值得学，什么需要重新证明', paragraphs:[
        '值得学的是分层验收：先确认模拟结构抵消了什么，再校准能拟合的项，最后验证未进入模型的项。三线方案适合有线数约束、引线匹配可控的场景；极低误差或引线变化明显时，应比较四线方案的成本和收益。',
        '接口检查重点是“配置与数据属于同一次测量”：把电流方向、增益、参考、有效标志与每个样本一起保存。本文不提供 SPI 时序或寄存器写入脚本；真实固件必须按具体器件文档验证。'
      ]}
    ]
  },
  {
    id: 'adi-cn0359', maker: 'ADI', title: '电导率：量程正确，还要激励正确',
    subtitle: 'CN0359 · 交流激励 / 模拟前端 / 自动量程 / 温度补偿',
    question: '精密电阻测得很准，为什么换成液体探头后仍会漂？',
    summary: '同看电路精度与探头物理，别让自动量程掩盖电极和温度问题。',
    published: '2015-11', revision: 'CN-0359 Rev. C · 2023-02', verified: '2026-10-17',
    evidence: '厂商参考设计台架 + 工程技术文章', reproduction: '未本站实物复现', status: '待学习',
    lessons: ['driver', 'reference', 'calibration', 'debug'],
    conditions: 'EVAL-CN0359-EBZ / ADuCM360 / AD8253；评估供电 6 V；交流激励、双极性采集与软件自动量程；可接 Pt100/Pt1000。评估板带预装固件，原文未指定测试固件版本或哈希。',
    sources: [
      {id:'report', label:'ADI CN-0359 Rev. C · pp.4–9 / Figure 6', url:'https://www.analog.com/media/en/reference-design-documentation/reference-designs/cn0359.pdf', date:'首发 2015-11；Rev. C 2023-02（p.10 修订记录）'},
      {id:'article', label:'ADI Analog Dialogue · 电导率测量工程文章', url:'https://www.analog.com/en/resources/analog-dialogue/articles/fully-automatic-self-calibrated-conductivity-measurement-system.html', date:'所读网页未显示可确认的原始发布日期；仅作工程背景，硬件版本以 Rev. C 为准'}
    ],
    blocks: [
      {label:'01 / THE REAL CONSTRAINT', title:'探头会被测量方法本身改变', paragraphs:[
        '厂商设计：交流激励配合电压/电流采集，AD8253 自动调增益，使 ADC 读数处于满量程的 10%–90%。Rev. C 强调激励幅度、频率和残余直流应符合探头要求，避免电解与极化。',
        '工程背景：ADI 的技术文章区分电导 G（S）与电导率 κ（S/cm）；后者还依赖探头池常数 K。温度补偿与探头几何同样进入测量链，因此“自动测量”不代表任意探头接上就准确。'
      ], sourceIds:['report','article']},
      {label:'02 / WHAT WAS MEASURED', title:'先确认 <0.1% 到底属于哪场测试', paragraphs:[
        '厂商实测：Rev. C Figure 6 使用 1 Ω–1 MΩ 精密电阻模拟电导池，报告最大误差 <0.1%。同页约 0.6% 的最坏情况预算和 0.22% 的 RSS 估算是计算，不能与这条实测曲线互换。',
        '本站判断：电阻不会极化，也没有溶液的温度梯度与污染。此测试有助于隔离电子链路，但不能推出全部真实溶液、全部探头或全宣传量程都有 <0.1% 误差；报告也没有提供这一测试的完整原始数据与不确定度预算。'
      ], sourceIds:['report']},
      {label:'03 / CALCULATE, DO NOT CLAIM', title:'一次温差，可能盖过整个前端误差', formula:'G = I / V；κ = K × G\n示意假设：温度系数 2%/°C × 温差 0.2 °C ≈ 0.4%', paragraphs:[
        '理论示意：第二式是人为选择参数的局部一阶估算，不是 CN0359 的实测结果或任何溶液的固定系数。若应用只容许 0.2% 误差，这个例子说明应先核对温度与补偿模型，而不是只换更高位 ADC。',
        '本站分析：自动增益减少小信号被噪声吞没或大信号削顶的风险，却产生量程切换瞬态。必须把增益状态和有效采样配对，检查切换附近连续性；不能把不同增益下的原始码直接拼成同一物理量。'
      ]},
      {label:'04 / BENCH ACCEPTANCE', title:'待执行的台架验收清单', paragraphs:['以下为本站建议，尚未执行。先使用安全隔离低压电源和电阻负载；液体测试遵循探头与样品安全要求，不用于判断饮用水是否安全。'], bullets:[
        '记录板卡/固件、激励幅度与频率、量程、原始 ADC 码、池常数、温度和补偿系数。更改接线前断电。',
        '先用可溯源电阻跨量程测试，特别测增益切换边界的上下行；分别报告稳态误差、瞬态、丢弃样本数和恢复时间。',
        '接入适合量程的已知标准液与探头，待温度稳定，比较补偿前后结果；另用未参与调整的标准液验证。门限应包含标准液和温度计的不确定度。',
        '在探头允许范围内检查激励改变、气泡、清洁、浸入深度与线缆是否引入漂移。电阻通过而标准液失败时，先查物理边界与温度，不先加重滤波。'
      ]},
      {label:'05 / BEFORE YOU REUSE', title:'更好的方案，取决于你测什么', paragraphs:[
        '可迁移的是“电阻替代台架 → 真实介质 → 独立验证”的分层方法，以及量程状态与样本有效性绑定。低功耗、小尺寸、隔离要求或高速变化场景未必适合这套前端，应重新比较功耗、成本、更新率和传感器接口。',
        '保留原始量、补偿后量、温度与质量标志，比只向上位机发送一个漂亮数值更有助于排障。此建议是本站的接口设计思路，不是对参考板已有协议功能的声称。'
      ]}
    ]
  },
  {
    id: 'st-an4073', maker: 'ST', title: 'STM32 ADC：固件活动也会进入噪声',
    subtitle: 'AN4073 §3 · Flash/ART / 码分布 / 平均与延迟',
    question: '关闭所有加速功能，就一定让 ADC 更安静吗？',
    summary: '用同条件对照测试分离数字活动、码分散与绝对测量误差。',
    published: '2012-03-19', revision: 'AN4073 Rev. 5 · 2013-07-02', verified: '2026-10-17',
    evidence: 'MCU 厂商典型实验室对照测试', reproduction: '未本站实物复现', status: '待学习',
    lessons: ['adc', 'error', 'debug'],
    conditions: '仅取 §3：STM32F407ZGT6 最小测试板，25 °C；VDD/VDDA/VREF+ 均 3.3 V；CPU 144 MHz，ADC 36 MHz、12 bit、3 周期采样；通道 2 单次转换，每个固定输入采集 50,000 次。原文附算法，未锁定编译器或固件构建版本。',
    sources: [
      {id:'report', label:'ST AN4073 Rev. 5 · §3 / Tables 2、4、5', url:'https://www.st.com/resource/en/application_note/an4073-how-to-improve-adc-accuracy-when-using-stm32f2xx-and-stm32f4xx-microcontrollers-stmicroelectronics.pdf', date:'首发 2012-03-19；Rev. 5 2013-07-02（p.31）'}
    ],
    blocks: [
      {label:'01 / THE REAL CONSTRAINT', title:'输入不变，软件配置仍能改变分布', paragraphs:[
        '厂商测试比较 ART 全开、全关、以及数据/指令缓存开但预取关三种配置，同时比较原始码与平均。输入取 0.3、1.65、3 V。这个设计把固件状态也当作测量条件。',
        '本站分析：用“开关全部关闭”代替受控实验并不可靠。数字活动可能经供电、参考或衬底影响采样；调整缓存也会改变执行时序。应比较同样输入、时钟和业务负载，而不是只看某一次曲线更平。'
      ], sourceIds:['report']},
      {label:'02 / WHAT WAS MEASURED', title:'±5 LSB 围绕众数，不是围绕真值', paragraphs:[
        '厂商实测：1.65 V、4 点平均时，ART 全开表中的码分散为 13 LSB，超出众数 ±5 LSB 的比例为 0.05%；缓存开、预取关时分别为 8 LSB、0%。数据来自 Tables 2、4 的同条件栏位。',
        '口径限制：0% 只表示该批样本未越过所定义窗口，不是永不越界。这里也不是绝对电压误差、ENOB 或全温保证。ST 在首页明确说明这些是典型实验室参考数据，未作量产测试。'
      ], sourceIds:['report']},
      {label:'03 / CALCULATE, DO NOT CLAIM', title:'平均得到的收益，要与更新时间一起交付', formula:'理想原始采样间隔 = 1 / 2.4 MSPS ≈ 0.417 µs\n4 次采集的理想时间下限 ≈ 1.667 µs（未计计算与调度）', paragraphs:[
        '厂商计算耗时对照：Table 5 的 4 点平均为 18 CPU 周期，8 点排序后丢弃 4 点为 517 周期；后一实现未优化，不能当所有排序算法的固定成本。',
        '理论推算：上式仅由该配置的原始速率换算。数据传输、算法、调度与窗口群延迟仍要另计。噪声下降不能自动证明零点、增益或采样建立偏差也消失；这正是“误差与重复性”实验需要区分的事。'
      ], sourceIds:['report']},
      {label:'04 / BENCH ACCEPTANCE', title:'待执行的台架验收清单', paragraphs:['以下为本站建议，尚未执行。使用已知安全隔离的低压信号源，先核对 MCU 引脚输入范围、模拟供电和公共参考。'], bullets:[
        '先锁定芯片具体型号/修订与勘误，记录编译器、优化级别、时钟、采样周期、缓存/预取及业务负载。不可把 §3 的结论和 §4 的 F42x/F43x 选项混用。',
        '固定低、中、高三个输入，按相同样本数比较配置；保存原始码直方图、相对参考的均值误差、标准差、峰峰值和越界计数。',
        '在安静状态与代表性通信/计算负载下重复，检查与采样时序的相关性；若更改配置也改变吞吐量，先控制这个混杂因素。',
        '用阶跃测响应，实测总采样到输出延迟、CPU 占用与丢样。应用验收门限应同时约束误差和延迟，不只约束曲线平滑度。'
      ]},
      {label:'05 / BEFORE YOU REUSE', title:'可复制的是对照方法，不是通用开关处方', paragraphs:[
        '这份资料适合学习如何把固件配置纳入模拟测量实验。换到 STM32 其他系列或其他 MCU，Flash、缓存、总线、ADC 结构都可能不同；先读具体参考手册与勘误，再建立自己的对照矩阵。',
        '本篇没有覆盖所有 MCU 厂商，也不证明 ST 的方案比其他厂商更好。是否采用一种优化，应由目标硬件、实际噪声来源、业务时限和可重复证据决定。'
      ]}
    ]
  }
,
{
  "id": "st-adc-overrun",
  "maker": "ST",
  "title": "ADC 停流：恢复搬运之前，先恢复帧边界",
  "subtitle": "STM32F407 · 扫描序列 / OVR / DMA 恢复 / 缓冲区所有权",
  "question": "平均数据量只有 60 kB/s，为什么 DMA 仍可能停住？",
  "summary": "把 ADC 数据寄存器溢出、DMA 错误和软件消费超时分开，再为重启后的第一帧建立身份。",
  "published": "2011-09-15",
  "revision": "RM0090 Rev 22 · 2026-05；HAL 固定提交 1f6451c3e077",
  "verified": "2026-10-18",
  "evidence": "厂商手册与驱动静态核对 + 本站故障设计推演",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "debug",
    "error"
  ],
  "conditions": "限定 STM32F407、ADC1 独立规则组、三 rank 外部定时触发、12 bit、无注入组。3.3 V，HCLK 168 MHz，PCLK1 42 MHz，PCLK2 84 MHz，ADC 21 MHz。示意缓冲区在 DMA 可达 SRAM1/2，不放 CCM。无指定板卡、编译器或已构建固件；软件版本仅指链接中的 HAL 源码提交，未编译、运行或烧录。原始发布日期指 RM0090 首版，本文不是 2011 年的实测报告。",
  "sources": [
    {
      "id": "rm",
      "label": "ST RM0090 Rev 22 · §§10.5、13.3.8、13.6、13.8.1；表 44 / 68",
      "url": "https://www.st.com/resource/en/reference_manual/dm00031020.pdf",
      "date": "首版 2011-09-15（p.1704）；所核版本 2026-05，Rev 22，1741 页；OVR 恢复见 p.402"
    },
    {
      "id": "dma",
      "label": "ST AN4031 Rev 3 · §§2–3、4.1–4.3 / 4.8",
      "url": "https://www.st.com/resource/en/application_note/an4031-using-the-stm32f2-stm32f4-and-stm32f7-series-dma-controller-stmicroelectronics.pdf",
      "date": "所核修订 2016-06-23；p.31 的停用 / 启用次序与 p.32 的停止后 NDTR 说明"
    },
    {
      "id": "ds",
      "label": "ST DS8626 Rev 12 · 表 67：ADC 获取、转换与上电时间",
      "url": "https://www.st.com/resource/en/datasheet/stm32f407ig.pdf",
      "date": "所核版本 2026-03，Rev 12；pp.135–137，不将典型值当成整板验收"
    },
    {
      "id": "hal",
      "label": "ST ADC HAL · 固定提交：IRQ / Start_DMA / Stop_DMA / ErrorCallback",
      "url": "https://github.com/STMicroelectronics/stm32f4xx-hal-driver/blob/1f6451c3e07728b4c830744de380e56bf5bc0026/Src/stm32f4xx_hal_adc.c",
      "date": "提交 1f6451c3e077（完整 SHA 见链接）；提交者日期 2026-06-05，作者日期 2025-07-04。只作静态阅读，不代表所用工程的 HAL 版本"
    },
    {
      "id": "errata",
      "label": "ST ES0182 Rev 19 · §§2.2.19、2.5.1",
      "url": "https://www.st.com/resource/en/errata_sheet/es0182-stm32f405407xx-and-stm32f415417xx-device-errata-stmicroelectronics.pdf",
      "date": "所核版本 2026-07，Rev 19；按目标芯片标记与 REV_ID 选择适用条目"
    },
    {
      "id": "license",
      "label": "ST HAL · 同一提交的 BSD-3-Clause 许可证",
      "url": "https://github.com/STMicroelectronics/stm32f4xx-hal-driver/blob/1f6451c3e07728b4c830744de380e56bf5bc0026/LICENSE.md",
      "date": "与代码相同的固定提交；厂商文档版权与软件许可证分开，不复制或执行厂商代码"
    }
  ],
  "blocks": [
    {
      "label": "01 / THE REAL CONSTRAINT",
      "title": "扫描是一次短突发，不是平均分配的三次采样",
      "paragraphs": [
        "本站方案：每 100 μs 用一次 TIM2_CH2 比较事件启动 ADC1 的三 rank 扫描，顺序为 PA0 / IN0、PA1 / IN1、PA2 / IN2；具体封装与板级占用仍须核对。ADC_CR1.SCAN = 1，SQR1.L = 2，CONT = 0，DISCEN = 0，MULTI = 00000；EXTSEL = 0011、EXTEN = 01。这是表 68 支持的具体路由，不是假定任意 TIMx_TRGO 都可用。",
        "时钟假设：APB1 预分频为 4，TIM2 时钟为 84 MHz；PSC = 83、ARR = 99，向上计数，CCR2 = 20。CH2 为输出比较（CC2S = 00、OC2M = 000），不需要把信号输出到引脚。初始化 UG / 预装载完成后清标志、CNT = 0，最后再启动；CCR2 决定每周期的比较位置，CNT 初值只影响起跑。此例没有从模式 Reset，也不以不同 CNT 初值声称稳定相移。",
        "ADC 公共 ADCPRE = 01，得到 84 / 4 = 21 MHz，各通道采样时间为 28 ADC 周期（SMP[2:0] = 010）。ADC1_DR → DMA2 Stream0 / Channel0，16 bit 到 16 bit、外设地址固定、内存递增、直接模式、循环模式，ADC DMA = 1、DDS = 1。384 个半字容纳 128 帧；HT / TC 各交出 64 帧。EOCS = 0 只改变 EOC 标志粒度，不会让 DMA 等序列末才搬走三个结果。"
      ],
      "sourceIds": [
        "rm",
        "ds"
      ]
    },
    {
      "label": "02 / WHAT THE EVIDENCE SAYS",
      "title": "“发生过错误”和“数据可以交付”是两件事",
      "paragraphs": [
        "厂商规则：RM0090 §13.8.1 说明，DMA 模式下出现 ADC OVR 后，DMA 请求被阻断；相关规则转换会被中止，后续规则触发可能被忽略。恢复需重新安排 DMA 目的地址与 NDTR、清 OVR，再重新触发。已正确搬入 RAM 的数据并非因此全部变坏，但可能只是一个不完整序列，不能自动当成完整帧。ADC_SR 的 OVR 为 rc_w0，不套用其他系列的写 1 清除方式。",
        "静态源码证据：所链接 HAL_ADC_IRQHandler 先记录 HAL_ADC_ERROR_OVR，再清硬件标志并调用错误回调。回调里只看 ADC_SR.OVR 可能已经是 0，应保存 HAL 错误码。默认弱回调不实现应用恢复；注释建议 Stop_DMA / Start_DMA，但这些函数不知道帧号、消费者持有哪些缓冲区，也不能撤回已排队的旧通知。",
        "证据边界：本篇没有厂商台架性能结果、第三方实测或本站板测。OVR 表示 ADC 数据路径丢失，不等于 DMA 的 TE / DME / FE；CPU 处理太慢导致循环缓冲覆盖，也未必产生 ADC OVR。三类问题应分别计数。没有 OVR 既不证明全部触发被接受，也不证明消费端及时读完。"
      ],
      "sourceIds": [
        "rm",
        "hal",
        "dma"
      ]
    },
    {
      "label": "03 / TWO DIFFERENT DEADLINES",
      "title": "帧周期很宽，寄存器服务窗口仍可能很窄",
      "formula": "t_acq = 28 / 21 ≈ 1.333 μs\nt_rank = (28 + 12) / 21 ≈ 1.905 μs\nt_scan = 3 × 40 / 21 ≈ 5.714 μs\n平均数据量 = 3 × 2 bytes × 10 kHz = 60 kB/s\n半缓冲完成间隔 = 64 × 100 μs = 6.4 ms",
      "paragraphs": [
        "本站理想计算：一次触发后，三个 rank 紧接着转换。DMA 必须及时读走 DR，不能拿 100 μs 帧周期当每个结果的服务期限；相邻结果间隔约 1.905 μs。AN4031 的仲裁与总线路径说明了为什么平均带宽充足仍不足以证明最坏延迟合格；提高 stream 优先级也不是无限期占用总线的保证。",
        "采样不是同时的：忽略额外间隙，三个保持时刻分别为 t_trigger + Δ + 1.333 / 3.238 / 5.143 μs，末次 EOC 为 t_trigger + Δ + 5.714 μs。Δ 是具体硬件触发传播延迟，不用 ISR 到达时间替代。1.333 μs 获取窗是否足够，要按源阻抗、通道阶跃与驱动器重新验证；这组数字只算时间，不宣称 12 bit 建立已经达标。",
        "第二个期限属于 CPU：HT / TC 的名义完成间隔为 6.4 ms，可将它用作保守处理预算，再扣 DMA 服务、中断延迟、调度与余量；不能从回调实际到达时重新计满 6.4 ms。真正的首个覆盖时刻仍要按扫描突发位置和 DMA 时序核对。块序号和所有权检查用于检测消费超时，ADC OVR 计数不能替代它。"
      ],
      "sourceIds": [
        "ds",
        "dma"
      ]
    },
    {
      "label": "04 / RECOVERY IS A NEW EPOCH",
      "title": "恢复顺序：先隔离旧数据，再重建接收链",
      "paragraphs": [
        "以下是本站推导的应用层状态机，不是已验证固件。限定本例单 ADC、无注入组；不能直接移植到多 ADC 公共 CDR、其他 STM32 系列或安全关键控制。 HAL 适配注意：该提交的 HAL_ADC_Start_DMA 在 EXTEN = 0 时会置 SWSTART。因此使用它时，应保持 TIM2 停止、先恢复 EXTEN = 01，再启动接收链；不能把“关住触发源”机械翻译为调用期间始终 EXTEN = 0，否则会提前启动一次扫描。"
      ],
      "bullets": [
        "1. 进入 FAULT：锁住发布端，记录 HAL 错误码、DMA 错误和块序号；停止 TIM2 新事件并禁止外部触发。仅停定时器不会取消已经开始的 ADC 扫描。回调只发恢复请求，避免在 ISR 中做无上限等待。",
        "2. 进入 QUIESCED：寄存器路径依 AN4031 先停 DMA stream，确认 DMA_SxCR.EN = 0，再停 ADC 并清 ADC DMA 请求；使用有超时的检查。EN = 0 后才重写地址 / NDTR。停 stream 也可能置 TCIF，所以恢复中的 TC 不能发布成正常完整块。",
        "3. 重建接收链：作废未确认的半区与旧回调通知，增加软件 generation；先等旧消费者退出并归还缓冲区，或改用确认空闲的新缓冲区。代次标签不能阻止仍在进行的内存读取。确认 ADC 已停止，再重设 rank 1 起始与缓冲基址，NDTR = 384，清相关 DMA 标志和 ADC OVR。保持触发关闭，先备好接收 stream，再使能 ADC 请求；ADC 上电后至少等 DS8626 的 3 μs 最大稳定时间。HAL 封装的内部顺序不等于这份寄存器清单，使用时须核对固定版本和返回状态。",
        "4. 进入 ARMED 再 RUN：完成 TIM2 的 UG、预装载与清标志，明确 CNT = 0 的起点，最后放行正式比较事件。只发布新 generation 中完整、顺序正确且仍归 CPU 所有的半区。若任一步超时或错误仍在，保持 FAULT；不要用最后一个值冒充新测量。"
      ],
      "sourceIds": [
        "rm",
        "dma",
        "ds",
        "hal"
      ]
    },
    {
      "label": "05 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。仅在确认安全隔离的低压台架上测试；模拟引脚不得超过数据手册额定值。"
      ],
      "bullets": [
        "冻结芯片标记 / REV_ID、固件哈希、编译选项、寄存器与时钟。先给三路不同已知低压输入，证明 rank 与缓冲索引一致；再用有时间关系的信号核对三路时差。",
        "分别施加合法范围内的总线负载与 CPU 处理延迟：记录 ADC OVR、DMA TE / DME / FE、块序号和消费者超时。延迟处理任务不能被当作必然诱发 ADC OVR 的办法。",
        "在首帧、半区边界附近、运行中停止与重启时检查 generation、丢弃的残缺帧和首个完整块。检验停 stream 造成的 TC、旧队列通知、重复恢复请求均不会让旧数据被再次发布。",
        "按应用要求制定最长恢复时间、允许缺测长度、阶跃建立误差和零错序门限。对照 ES0182 的序列修改及 DMA2 并发访问限制；通过此用例不代表规避了整份勘误。"
      ],
      "sourceIds": [
        "errata"
      ]
    },
    {
      "label": "06 / TRY TO BREAK THE CLAIM",
      "title": "练习：199 个有效数据，等于几帧？",
      "paragraphs": [
        "纸面任务：已知从 rank 1 启动、尚未循环回绕，停稳后读到 NDTR = 185。384 − 185 = 199，即 66 个完整三通道序列加 1 个残余数据。只凭“这些数据有效”不能发布第 67 帧；如果无法证明起始位置、代次和回绕次数，连这项帧数推断也不能照搬。",
        "再回答：把 EOCS 改为 0，为什么仍不能防止 DMA 模式下的 OVR？为什么重启后 NDTR 又是 384，仍不能证明数据从同一个时间原点开始？把答案与第 2、4 节对应，并写出你的消费者如何拒绝旧 generation。OVR 是状态标志，不是精确的漏采样计数器。",
        "复用边界：采用的是错误隔离与帧身份方法，不是承诺某块板的吞吐或恢复时间。厂商文档保留其版权；链接的 HAL 提交采用 BSD-3-Clause，若复制源码或二进制须按原许可证保留所需声明，不用 ST 名义背书。本站未复制厂商实现，也未运行候选代码。"
      ],
      "sourceIds": [
        "rm",
        "license"
      ]
    }
  ]
}
];
