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
},
{
  "id": "ti-ads1256-mux",
  "maker": "TI",
  "title": "ΔΣ 轮询：30 kSPS 不等于四路各 7.5 kSPS",
  "subtitle": "ADS1256 · 数字滤波建立 / MUX 轮询 / 模拟保护时间 / 样本身份",
  "question": "第一份有效结果，为什么要等比 1 / ODR 更久？",
  "summary": "把稳态输出率、换通道后有效吞吐和整帧期限分开，找出“换了 MUX 却读到旧通道”的正确解释。",
  "published": "2003-06",
  "revision": "ADS1256 SBAS288K · 2013-09；SBAA535A · 2024-03",
  "verified": "2026-10-19",
  "evidence": "厂商数据手册与应用笔记核对 + 本站独立时序预算",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "driver",
    "error",
    "debug"
  ],
  "conditions": "限定 ADS1256 单 ADC、四组差分输入顺序轮询，每通道每轮保留一个有效结果；不是多 ADC 同时采样或交错模式。教学条件：AVDD 5 V、DVDD 3.3 V、VREF 2.5 V、PGA ×1、输入缓冲开启、30,000 SPS、CLKIN 7.68 MHz、SCLK 1.92 MHz。各模拟引脚假设在 0.5–2.5 V，仍须核对实际共模、差分范围与驱动能力。版本仅锁定文档；无指定板卡、MCU、固件或编译器，未下载、编译、运行或烧录厂商程序。",
  "sources": [
    {
      "id": "ds",
      "label": "TI ADS1256 · SBAS288K：pp.3、6、20–22、27、34–37",
      "url": "https://www.ti.com/lit/ds/symlink/ads1256.pdf",
      "date": "正文首发 2003-06，Rev. K 2013-09；p.38 修订记录为 2013-09-12。所读 PDF 的封装附录另标 2025-11-11，不是电气正文的新版本。"
    },
    {
      "id": "latency",
      "label": "TI SBAA535A · §§2、5.1、6–7：转换延迟与模拟建立",
      "url": "https://www.ti.com/lit/pdf/SBAA535",
      "date": "首发 2022-03；Rev. A 2024-03。只采用延迟分类与模拟建立方法，不把其中 ADS124S08 的寄存器套给 ADS1256。"
    }
  ],
  "blocks": [
    {
      "label": "01 / DEFINE THE DELIVERABLE",
      "title": "要交付四路一帧，先明确“速率”是哪一种",
      "paragraphs": [
        "本站设计任务：四路慢变化传感器，希望每 1 ms 交付一帧，并限制换路造成的残留误差。只比较 4 × 1 kSPS 与 30 kSPS 会漏掉第一次有效转换的成本；本例需要每次换通道后重新建立数字滤波状态。",
        "厂商证据：SBAS288K Table 13 给出 30,000 SPS 时 t18 = 0.21 ms；Table 14 的轮询吞吐为 4,374 results/s，条件是 CLKIN = 7.68 MHz、SCLK = CLKIN / 4 和 3 字节 MUX WREG。它是总通道结果率，不能给每一路都分配 4,374 SPS。",
        "证据边界：这些是文档时序表，不是本文新增台架实测。SBAA535A 区分稳态转换周期、第一份有效结果的延迟与整轮扫描时间。外部模拟信号还没稳定时，内部滤波完成不能替它兜底；24 位输出字也不是 24 位有效精度保证。"
      ],
      "sourceIds": [
        "ds",
        "latency"
      ]
    },
    {
      "label": "02 / CHOOSE THE SEQUENCE",
      "title": "先记住旧通道，再切到新通道",
      "formula": "DRDY(old) → 保存 old 身份 → WREG MUX(next) → SYNC\n→ 满足 t11，并等待额外模拟 guard → WAKEUP → RDATA(old)\n→ 下一次有效 DRDY(next)",
      "paragraphs": [
        "厂商 Figure 19 的关键是流水关系：写下一通道并重新同步之后，RDATA 取出的仍是上一通道结果。本站据此选择显式 RDATA 轮询，在启动前确认不处于 RDATAC 读连续模式，并分别保存 completed_channel 和 converting_channel，不能拿当前 MUX 寄存器给刚读出的数据贴标签。",
        "时序依据：p.6 的 WREG 后命令间隔至少 4 个 CLKIN 周期；SYNC 到 WAKEUP 至少 24 个周期；RDATA 命令后到读数时钟至少 50 个周期。1.92 MHz SPI 下，32 个读命令/数据时钟加 50 / 7.68 μs，约 23.177 μs，可与新通道转换重叠。这不是完整 SPI 驱动或可直接烧录的配置，CS、边沿、建立/保持及返回状态仍须逐项核对。",
        "本站扩展：若要加模拟等待，先用 SYNC 停住转换，再在 WAKEUP 前延长等待；不在旧数据还可能被更新时长时间搁置。这里保持正常供电，不使用 STANDBY；低功耗唤醒、校准和首次启动应另列预算。RDATA 传输时间已在此流水方案中重叠，不能不加解释地再全额叠加到 Table 14 的每个槽位。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "03 / TWO CLOCKS, TWO DEADLINES",
      "title": "四路“够快”的余量，其实只有约 85 μs",
      "formula": "稳态间隔 = 10⁶ / 30000 = 33.333 μs\n名义轮询槽位 t_slot = 10⁶ / 4374 ≈ 228.624 μs\n四路帧周期 = 4 × t_slot ≈ 914.495 μs\n每路更新率 = 4374 / 4 = 1093.5 SPS\n首末通道就绪间隔 = 3 × t_slot ≈ 685.871 μs",
      "paragraphs": [
        "本站换算：这些数值直接由厂商条件表推算，尚未加入软件响应、模拟保护时间、时钟容差和交付处理。Table 13 的 0.21 ms 已舍入，不用它反推出一个与 Table 14 必须逐纳秒相等的命令时间；结果保留小数只是便于复算，不表示器件精度。",
        "还有更短的服务期限：假设 DRDY 后最多 5 μs 开始服务，3 字节 WREG、4 CLKIN 间隔和 1 字节 SYNC 合计到停流约 5 + 24 / 1.92 + 4 / 7.68 + 8 / 1.92 = 22.188 μs，小于名义 33.333 μs 下一次结果更新间隔。若软件延迟失守，旧结果可能被覆盖；不能因为整帧还有余量就继续相信 old 标签。此计算不替代逻辑分析仪验证，也没有覆盖 DRDY 更新禁读窗口。",
        "四个就绪时刻并不相同。这里的 685.871 μs 是结果就绪跨度，不是精确采样孔径或四路公共时间戳；ΔΣ 输出包含一段输入历史。需要瞬时相位关系时，应重新选择同步多 ADC 架构并计算滤波群延迟，不能把同一 frame_id 当作同时采样的证明。"
      ],
      "sourceIds": [
        "ds",
        "latency"
      ]
    },
    {
      "label": "04 / ANALOG SETTLING IS SEPARATE",
      "title": "加上模拟保护时间，1 ms 目标就会失守",
      "formula": "独立假设：ΔV = 2 V，容许残留 ε = 2 μV，τ = 2 μs\nt_guard = τ × ln(ΔV / ε) = 27.631 μs\n每槽额外软件时间 = 5 μs（人为上界，未测量）\nT_frame = 4 × (228.624 + 27.631 + 5) ≈ 1045.019 μs\n帧率 ≈ 956.921 Hz；1 ms 余量 ≈ −45.019 μs",
      "paragraphs": [
        "本站独立一阶模型：e(t) = ΔV × exp(−t / τ)。可把 τ = 2 μs 理解为理想差分 RC，两臂各 R = 1 kΩ、跨接 C = 1 nF 时 τ = 2RC。这里人为规定节点发生 2 V 阶跃，以 2 μV 作为分配给建立残差的绝对误差份额；它不是整机总误差，也不是 ADS1256 的半 LSB 要求。",
        "适用边界：这是共享前端、外部换路或信号源阶跃的保护时间示意，不是 ADS1256 内部 MUX / 采样电容的物理仿真。每通道独立且已稳定的 RC 不会因为内部 MUX 改地址，就必然经历此完整阶跃。开关电荷、输入电流、驱动器非线性、噪声和多极响应均未建模，应按实测最坏阶跃重新分配。",
        "本站选择：把完整 27.631 μs 作为 Table 14 基线之外的额外等待，安排在 SYNC 后、WAKEUP 前；没有把它偷算进已存在的最小命令间隔。5 μs 也作为每槽额外软件占用保守相加。这样四路 1 kHz 目标已失败，还没计最终处理与发布；可放宽刷新率、减少通道或重选前端，不能用平均滤波“修好”漏掉的期限。"
      ],
      "sourceIds": [
        "latency"
      ]
    },
    {
      "label": "05 / KEEP THE IDENTITY",
      "title": "启动、超时和重试，都要重新证明样本归属",
      "paragraphs": [
        "本站实现约束：启动时先确定首通道，完成器件要求的初始化、参考稳定和校准，再同步并等待首次有效 DRDY；没有已知 completed_channel 的前缀不发布。正常槽位记录 scan_id、channel_id、配置版本、原始码、同步/就绪时间和有效标志；整帧仅接受四个不同且顺序正确的通道。",
        "只有 MUX、SYNC / WAKEUP、RDATA 各步骤成功且时限满足，才提交状态转换。SPI 失败、错过服务期限、超时或运行中改变 PGA / 数据率时，作废当前未完成帧并回到已知配置重新起帧；不按“收到第几个中断”盲目增加通道号。ADC 校准需求与耗时另查手册，不纳入这个固定配置稳态例子。",
        "这些是本站应用层规则，未运行在硬件上。重读同一结果不能当作新采样，补上最后一个旧值也不能假装连续测量。显示保留值时，应明确标为 stale，并给出缺测区间；重复启动请求应合并，不能交叉发两套 MUX 命令。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。仅在已确认安全隔离的低压台架进行，先核对输入、参考和数字电平范围，换接前断电。2 μV 是模型份额，不自动成为可由现有仪器验证的整板合格门限。"
      ],
      "bullets": [
        "冻结 ADS1256 型号、板卡/固件版本、供电、PGA、缓冲、数据率、CLKIN 与 SCLK。逻辑分析仪记录 DRDY、CS、SCLK、DIN、DOUT，检查 WREG / SYNC / WAKEUP / RDATA 及 t11、t6 的最坏值。",
        "四路接不同已知稳定输入，比较固定通道与轮询；使用相反顺序和最大合法通道电平差，检查旧通道归属、首个有效结果和串扰。先量总结果率，再量每路更新率与整帧发布时间。",
        "在安全范围内施加可控源阶跃，扫额外 guard、源阻抗和负载；用独立验证数据报告均值误差、噪声、残差及标准器不确定度，不能把误差平均到看不见就算建立合格。",
        "注入软件服务延迟、SPI 失败、漏 DRDY、重复启动及配置切换；验收零错标签、残缺帧不发布、超时有界与缺测可见。包括首次启动和恢复后首帧；实测最坏帧期与交付延迟才决定是否满足 1 ms。"
      ]
    },
    {
      "label": "07 / MIGRATE THE METHOD",
      "title": "练习：少两路、降数据率，分别改变什么？",
      "paragraphs": [
        "纸面迁移 A：保持相同槽位预算但只测两路，T_frame = 2 × (10⁶ / 4374 + 27.631 + 5) ≈ 522.509 μs，约 1913.841 帧/s。通道数减少会缩短扫描周期，却不会消除单槽的建立成本，也不自动改善单次精度。",
        "纸面迁移 B：仍测四路，把输出数据率改成 2000 SPS。Table 14 对应总轮询率是 1438 results/s；沿用示意 guard 和 5 μs 后，T_frame ≈ 2912.165 μs。请另查这个工作点的噪声和校准要求，再决定是否值得用更新率换噪声表现；不能从“数据率降低”直接宣布误差更小。",
        "请交付自己的预算表：列出数据手册版本、首次/稳态时间、通道数、允许误差、源阶跃、额外等待、软件最坏延迟和采样身份规则；说明哪个值来自厂商、哪个是设计假设、哪个仍待台架验证。换型号必须重新查滤波器重启和数据归属，不能照搬 Figure 19。",
        "版本与许可：本文与数值回归为原创教学材料，未复制或执行厂商固件。TI 数据手册和应用笔记保留各自版权，公开可读不等于开源代码许可证；复用厂商软件应另查其具体许可证。本篇未复刻参考板，也没有第三方实测或生产部署结论。"
      ],
      "sourceIds": [
        "ds",
        "latency"
      ]
    }
  ]
},
{
  "id": "st-dma2-gpio-contention",
  "maker": "ST",
  "title": "DMA stream 没冲突，为什么采样联动仍会错？",
  "subtitle": "STM32F407 · 三路错相 ADC / GPIO 激励 / DMA2 双端口",
  "question": "在已能稳定采集的三路 ADC 旁边加一路定时 GPIO，为什么不能只查 stream 分配表？",
  "summary": "沿请求、地址、总线端口和模拟建立逐项验收，把 DMA2 并发勘误与平均带宽、数据身份分开。",
  "published": "2014-02-04",
  "revision": "AN4031 Rev 3 · 2016-06-23；ES0182 Rev 19 · 2026-07；RM0090 Rev 22 · 2026-05",
  "verified": "2026-10-20",
  "evidence": "厂商手册 + 器件勘误 + 本站原创调度推演；无板卡或第三方实测",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "driver",
    "debug"
  ],
  "conditions": "限定 STM32F407，版本见上方；沿用 MCU 时序页的 TIM1 → TIM2 / TIM3 / TIM4、ADC1 / 2 / 3 独立模式、21 MHz ADC 时钟、12 bit、每帧各一次采样。这里新增的是文档导出的 GPIO 激励控制候选，并非 ST 已交付的完整三路联调参考设计。尚未选定板卡、封装、GPIO 引脚、外部激励电路或固件版本；连线与负载延迟待验证。未运行厂商代码或连接硬件。",
  "timingRelated": true,
  "sources": [
    {
      "id": "errata",
      "label": "ST ES0182 Rev 19 · §2.2.19 / p.13，§2.7.2 / pp.17–18",
      "url": "https://www.st.com/resource/en/errata_sheet/es0182-stm32f405407xx-and-stm32f415417xx-device-errata-stmicroelectronics.pdf",
      "date": "采用 2026-07 修订版；适用器件与硅修订范围见首页和表 3"
    },
    {
      "id": "dma",
      "label": "ST AN4031 Rev 3 · §§1.1、4.9 / pp.6–14、33–35",
      "url": "https://www.st.com/resource/en/application_note/an4031-using-the-stm32f2-stm32f4-and-stm32f7-series-dma-controller-stmicroelectronics.pdf",
      "date": "首发 2014-02-04；采用 2016-06-23 修订版，日期见 p.37"
    },
    {
      "id": "rm",
      "label": "ST RM0090 Rev 22 · 表 44/45/68/98，DMA / ADC / TIM 寄存器",
      "url": "https://www.st.com/resource/en/reference_manual/dm00031020-stm32f405415-stm32f407417-stm32f427437-and-stm32f429439-advanced-armbased-32bit-mcus-stmicroelectronics.pdf",
      "date": "采用 2026-05 Rev 22；本次复核既有完整 PDF。官方远程 PDF 本次读取失败，未把搜索摘要的 Rev 21 当作 Rev 22"
    }
  ],
  "blocks": [
    {
      "label": "01 / A NEW REQUEST IS A NEW PATH",
      "title": "从三路采样，走到采样与激励联动",
      "paragraphs": [
        "本站拟议问题：每个 100 μs 帧内，ADC1、ADC2、ADC3 在 20、50、80 μs 附近开始各自的采集。现在希望 TIM1_CH1 比较事件每帧先更新一次 GPIO 激励状态，再由三路 ADC 观察响应。数据链从“定时器 → ADC → SRAM”扩展为“定时器 → DMA → GPIO → 外部模拟电路 → ADC → DMA → SRAM”。后半条链的延迟和状态也属于测量。",
        "请求路由复核：沿用 ADC1 → DMA2 Stream0 / Channel0、ADC2 → Stream2 / Channel1、ADC3 → Stream1 / Channel2；另选 TIM1_CH1 → DMA2 Stream6 / Channel0。四个 stream 不重叠。同为 Channel0 不表示共享一个 stream；CHSEL 是每个 stream 的请求选择。本例只开 TIM1 的 CC1DE，并保持 CCDS = 0，不同时打开该复用请求上的 CC2DE / CC3DE。GPIO 地址不是请求源，TIM1 的比较才是节拍。沿用 TIM1 的 1 MHz 计数 tick，设 CCR1 = 5、CC1S = 00、OC1M = 000（定时比较）；CC1 预装载值在受控更新边界装载。此内部请求不要求把 TIM1_CH1 输出到引脚。",
        "沿用的三条 ADC 触发链仍是 TIM1 Update/TRGO → ITR0，TIM2_CC2 / TIM3_OC1REF(TRGO、PWM2) / TIM4_CC4 → ADC1 / ADC2 / ADC3。相位由 CCR 决定，Reset 模式会覆盖 CNT 初始偏移；一个 ADC 的扫描是顺序采样，不能换个 DMA 标签就变成三个 ADC 同时采样或交错模式。新 GPIO 候选没有改变这些已说明的模式边界。"
      ],
      "sourceIds": [
        "rm"
      ]
    },
    {
      "label": "02 / READ THE SILICON LIMIT",
      "title": "不冲突的 stream，仍可能经过有条件限制的端口",
      "paragraphs": [
        "厂商勘误：ES0182 §2.2.19 指出，DMA2 同时服务 AHB 与 APB2 外设请求时，AHB 侧访问可能重复；列出的受影响操作包含经默认 peripheral port 写 GPIO。它特别区分了 GPIO 读取，以及重复访问内部 SRAM 不造成该项数据破坏的情形。不能把这条限制简写成“ADC DMA 一定会坏”，也不能因为没有 stream 冲突就排除它。",
        "本站判断：给 GPIO 分配更高优先级、降低平均吞吐或观察一次 TC，都没有改变实际端口路径；这些办法不是该勘误列出的规避措施。只重复同一个 BSRR 置位/复位字时，逻辑值可能不变，但这不构成整个带时序状态序列的可靠性证明。错误是否可见、是否有诊断标志、延迟有多大，仍要分别验证。",
        "这里没有复现故障，也没有来自独立第三方的发生概率或修复收益。勘误证明的是需要审查的条件；本站例子的失败率、最长延迟和系统精度均未知。"
      ],
      "sourceIds": [
        "errata"
      ]
    },
    {
      "label": "03 / PORT NAMES ARE NOT PHYSICAL DESTINATIONS",
      "title": "先简化硬件路径，再审查端口反转候选",
      "paragraphs": [
        "优先选择：如果激励只需要一个规则方波，而且选定引脚、极性、电气负载及通道资源都允许，可考虑让定时器直接输出 AF 波形，减少 GPIO DMA 这条路径；这不是任意 MUX 地址序列的替代品，也不是已核验的板级接线。本页没有指定 GPIO 引脚或替用户完成外部电路设计。",
        "厂商文档给出的方向：让 GPIO 写入走 DMA2 memory port。AN4031 §4.9 解释两端口的可交换连接、预读、FIFO 及尾部数据约束。按照其机制和 RM0090 表 45 推导，一种待验证的“SRAM 模式字 → GPIOx_BSRR”候选是 DIR = 00，PAR 指向模式数组，M0AR 指向 BSRR；PINC = 1、MINC = 0，PSIZE = MSIZE = 32 bit，PFCTRL = 0、CIRC = 0、DBM = 0、PINCOS = 0，DMDIS = 0 采用直接模式。此模式由硬件令 MSIZE 与 PSIZE 相等、burst 为 single；配置仍写成一致值。NDTR 是 32-bit 命令条数，源数组须 4-byte 对齐并放入 DMA 可达 SRAM1 / SRAM2，不能放 CCM。看起来叫 Peripheral-to-memory，物理目的地仍可以是 GPIO。",
        "这是针对文档端口规则的配置审查单，不是完整驱动。必须逐项核对 stream 请求、对齐、可达 SRAM、模式字内容、NDTR 单位与停止次序。不能只交换 PAR/M0AR 而保留原来的递增位；也不能用 DIR = 10 的 memory-to-memory 模式代替需要定时器节拍的传输。AN4031 的 Quad-SPI 示例不属于 F407，不能照搬其外设、stream 或初始化。",
        "每次请求一字的候选刻意不用 FIFO 阈值攒写：GPIO 没有接收 FIFO，多字在阈值满足后连续送出，可能把本应分开的状态变化挤在一起。直接模式仍有仲裁与总线延迟；它只避免这里讨论的阈值批量释放，不等于 GPIO 与比较事件零延迟。尤其本候选为 direct P2M 且 MINC = 0：RM0090 §10.3.18 指出，前一目标写未结束又来请求时可能触发 DMEIF，并出现两个数据项连续写到同址。DMEIF 不自动停 stream；它与 ES0182 的重复访问是两种不同风险。"
      ],
      "sourceIds": [
        "dma",
        "rm",
        "errata"
      ]
    },
    {
      "label": "04 / BUDGET THE WHOLE CAUSAL CHAIN",
      "title": "采样提前量，要从 GPIO 真正改变时刻起算",
      "formula": "本站假设：T = 100 μs；激励请求 = 5 μs；ADC 触发 = 20 / 50 / 80 μs\nGPIO 路径上界假设 2 μs + 模拟建立 10 μs + 设计余量 2 μs = 14 μs\n最早 ADC 与激励请求间隔 15 μs；15 − 14 = 1 μs（条件性余量）\n获取时间 = 28 / 21 = 1.333 μs；转换总时间 = (28 + 12) / 21 = 1.905 μs",
      "paragraphs": [
        "所有额外延迟和余量都是本站设定的练习参数，不是 F407 保证值或测量值。先保守要求模拟信号在最早的 ADC 触发之前已建立，不借用未知触发传播延迟增加预算。若 GPIO 路径在实际负载下为 4 μs，同样的算式得到 −1 μs，计划不通过；平均带宽再低，也不能补回丢失的建立时间。ADC 自身获取窗和输入源阻抗还要单独验收。",
        "本站纯算术：三 ADC 每帧各搬一个 16-bit 结果，100 μs 帧率下原始结果流为 60,000 byte/s；GPIO 每帧一个 32-bit 模式字，源模式载荷为 40,000 byte/s。100,000 byte/s 是两类逻辑载荷之和，未计每次传输的读写总线交易、仲裁与其他主设备，不能作为 AHB 占用率或最坏延迟。",
        "三路相位不同，记录应保留 frame_id、config_id、激励状态、预定相位与有效标志；DMA 回调到达时刻不是采样孔径。若激励更新超时，就把依赖它的整帧标为无效，不能拿“ADC 数据都到齐”替代“测量条件已成立”。单路 ADC 缺一次结果也不能把随后第 n 个数组元素与另两路第 n 个元素静默拼成一帧。"
      ],
      "sourceIds": [
        "rm"
      ]
    },
    {
      "label": "05 / STARTUP IS PART OF THE EXPERIMENT",
      "title": "UG、第一帧与模式数组，必须共享起点",
      "paragraphs": [
        "本站拟议协议：在触发关闭的准备阶段完成时钟、定时器预装载与 UG，设置三路 ADC/DMA 和 GPIO 模式流；随后才进入约定的帧起点。配置时的 UG 可能沿更新/TRGO 链传播，不能混进正式数据。预装载也不会自动把四个 stream、三个从定时器及软件标签变成原子事务。运行中改相位或模式表时，先停源、完成受控停流和旧消费者退出，再以新的 config_id 重建对齐；本例不宣称支持无缝热切换。",
        "厂商时钟约束：接收端时钟必须先于主 TRGO 启用，接收事件时不能临时改变目标时钟分频。GPIO 输出锁存值、第一模式字和首个有效 ADC 帧要能对应；即使 ADC 自己运行正确，错一位的激励标签也会制造看似稳定的“传感器误差”。",
        "为便于验收，本候选从有限长度模式表与可识别帧号开始，暂不自动循环 GPIO 模式流。模式表耗尽必须关闭后续激励/采样调度；不能把维持的旧电平标成一条已经执行的新命令。DBM 交替的是 M0AR/M1AR，不能用它为本候选 PAR 上的源模式数组自动双缓冲。三路 ADC 的循环/双缓冲仍须按已完成块移交，不能改动 DMA 正在写的块。停止 GPIO DMA 时出现的 TC 也不能自行证明全部 NDTR 项都按计划送达。以上是待实现状态协议，不是已运行的固件。"
      ],
      "sourceIds": [
        "rm",
        "dma",
        "errata"
      ]
    },
    {
      "label": "06 / UNPERFORMED BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下计划尚未执行。仅在已确认安全隔离的低压台架上开展，GPIO 不直接驱动超额负载；先查引脚耐压、驱动电流、探头额定值及外部电路。"
      ],
      "bullets": [
        "冻结配置：记录完整料号、硅修订、手册版本、时钟树、ITR/TRGO/EXTSEL、DMA 请求与两端口地址、每个递增位、数据宽度、PL 软件优先级、预装载位和模式表。未知封装引脚、外部连接、最坏 GPIO 延迟与模拟建立时间保持“待验证”。",
        "先隔离层次：分别检查定时器标记、真实 GPIO 边沿、外部模拟响应与 ADC 数据；逻辑分析仪只能验证数字边沿，不能证明模拟已建立。对每个有效帧验证激励状态身份和三路数量，保留原始记录。",
        "在明确允许的负载组合下比较单路/并发路径，记录请求到 GPIO 的最大延迟、漏/重复状态、ADC OVR、DMA TE/DME/FE、缺帧与应用积压。通过标准来自预先写出的预算；没有捕获异常不等于排除了低概率勘误。",
        "覆盖首帧、末字、停止中断、重启、模式表变更、延迟超预算、单 ADC 丢样与块处理超时。任一路身份或时限不明就拒绝整帧，不用最后一个旧值冒充成功；清楚区分文档核验、原创模型通过、实际驱动与实物测试。"
      ]
    },
    {
      "label": "07 / TRANSFER THE METHOD",
      "title": "练习：把“采到了”拆成四个验收条件",
      "paragraphs": [
        "练习一：保持 100 μs 帧长与 5 μs 激励请求，将最早 ADC 相位从 20 改为 10 μs。上面 14 μs 的路径假设仍成立时，余量变为 −9 μs；不要只看各 ADC 的 1.905 μs 转换时间小于一帧就判为可行。再把最早相位改为 30 μs，条件性余量为 11 μs，仍需实测证据支撑那个 2 μs 上界。",
        "练习二：模式数组以 0x20001000 为假定起点，每项 32 bit，目标 BSRR 固定。端口反转后连续三次应读取 0x20001000、0x20001004、0x20001008，写入同一目标地址。若把 PINC/MINC 留成 0/1，就会反复读第一个模式字，并走向目标之后的寄存器；这是地址模型反例，不在硬件上执行。",
        "迁移回 MCU 时序页检查三路相位；回到 ADC 建立实验解释“数字事件准时”为什么还不够。四项验收分别是路由合法、数据搬运有序、外部条件已建立、数据身份可信，任何一项都不能由其他项自动替代。",
        "许可与边界：这里仅链接官方手册并提供原创分析、算术和地址模型，没有复制或运行厂商驱动、代码示例或图表。公开手册不是开源代码许可证；后续软件、硬件设计文件及商标分别适用各自许可。本站没有获得或声称第三方测试背书，未证明量产可靠性。"
      ]
    }
  ]
},
{
  "id": "st-m7-adc-cache",
  "maker": "ST",
  "title": "ADC 已搬完，CPU 为什么还读到旧数据？",
  "subtitle": "STM32H743 · Cortex-M7 D-Cache / 32-byte 缓存行 / 接收块所有权",
  "question": "DMA 完成中断到了、数组却没更新，是 ADC 没采到吗？",
  "summary": "把地址可达、缓存可见与缓冲区所有权分开检查，不用关缓存掩盖交接错误。",
  "published": "2016-03-23",
  "revision": "AN4839 Rev 2 · 2018-03-06；RM0433 Rev 9 · 2026-10-02",
  "verified": "2026-10-21",
  "evidence": "厂商缓存示例与手册核对 + 本站接收协议和验收推演",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "debug",
    "error"
  ],
  "conditions": "教学目标限定单核 STM32H743 的 ADC 接收缓冲区，DMA1/2 写入可达 SRAM，Cortex-M7 D-Cache 开启、目标区域为 Normal write-back。未指定板卡、硅修订、采样时钟、ADC 请求/stream 路由、HAL/CMSIS 构建版本或编译器；不是可直接烧录的配置。AN4839 的原始示例是内存到内存复制，不是本文 ADC 台架实测。原始日期指 AN4839 首版，核验日期不是实验日期。",
  "sources": [
    {
      "id": "an",
      "label": "ST AN4839 Rev 2 · §§2.1、3.2、4；修订记录 p.9",
      "url": "https://www.st.com/resource/en/application_note/an4839-level-1-cache-on-stm32f7-series-and-stm32h7-series-stmicroelectronics.pdf",
      "date": "首版 2016-03-23；Rev 2 2018-03-06。核验 2026-10-21；示例不提供本文 ADC 测试记录。"
    },
    {
      "id": "rm",
      "label": "ST RM0433 Rev 9 · Table 3 p.104、§2.4 p.136、Table 637",
      "url": "https://www.st.com/resource/en/reference_manual/rm0433-stm32h743-753-and-stm32h750-value-line-advanced-arm-based-32-bit-mcus-stmicroelectronics.pdf",
      "date": "首版 2016-12-12；Rev 9 2026-10-02，3329 页。核验 2026-10-21：官方 PDF 下载、文本与互连表图像均已核对；搜索索引仍可能显示旧 Rev 8。"
    },
    {
      "id": "faq",
      "label": "ST 员工技术说明 · DMA is not working on STM32H7 devices",
      "url": "https://community.st.com/stm32-mcus-60/dma-is-not-working-on-stm32h7-devices-97",
      "date": "页面首发 2018-07-23；动态网页未锁定修订号，核验 2026-10-21。仅引用作者正文，不把评论中的建议当实测。"
    },
    {
      "id": "arm",
      "label": "Arm 员工答复 · Cortex-M7 推测读取与 DMA 缓冲区",
      "url": "https://community.arm.com/forums/f/architectures-and-processors-forum/52740/on-cortex-m7-can-speculative-access-bring-accessed-data-to-d-cache/177510",
      "date": "页面只显示相对时间，未确认精确首发日期；核验 2026-10-21。引用 Zenon (Zhilong) Xiu 的机制说明，不引用匿名评论作硬件保证。"
    },
    {
      "id": "cmsis",
      "label": "Arm CMSIS-Core · D-Cache Functions API 文档",
      "url": "https://arm-software.github.io/CMSIS_6/main/Core/group__Dcache__functions__m7.html",
      "date": "CMSIS_6 main 动态文档，核验 2026-10-21；只核对按地址操作的 32-byte 对齐与 byte 长度口径，不声称锁定软件版本。"
    }
  ],
  "blocks": [
    {
      "label": "01 / THE REAL CONSTRAINT",
      "title": "搬运完成与 CPU 看见新值，是两件事",
      "paragraphs": [
        "厂商说明：AN4839 展示 CPU 和 DMA 共享可缓存内存时的可见性问题。clean 把脏缓存行写回内存；invalidate 丢弃缓存中的副本。它们方向不同，不能把两个词当成“刷新”的同义词。",
        "本站问题模型：ADC 结果已由 DMA 写到 SRAM，CPU 却可能命中旧的 D-Cache 副本。volatile 只能约束编译器对访问的处理，不会完成硬件缓存维护；反过来，invalidate 也不会修复 ADC 溢出、错误地址或消费者处理太慢。先判断是哪一层失败。"
      ],
      "sourceIds": [
        "an",
        "faq"
      ]
    },
    {
      "label": "02 / CHECK REACHABILITY FIRST",
      "title": "“不缓存的内存”不一定能被这个 DMA 访问",
      "paragraphs": [
        "精确型号边界：RM0433 Rev 9 Table 3 中，STM32H743 的 DMA1/2 无法访问 ITCM/DTCM；§2.4 给出 DTCM 起点 0x20000000，CPU 和 MDMA 有对应访问路径。AXI SRAM 起点 0x24000000、D2 SRAM1 起点 0x30000000，可供 DMA1/2 使用。是否可缓存则取决于 CPU 路径和 MPU 属性，是另一项检查。",
        "不能把 AN4839 的 SRAM→DTCM 示例拓扑直接套到 H743 DMA1/2，也不能把 H743 结论扩展为所有 F7/H7 或所有 DMA 引擎都相同。本文不指定 ADC 请求编号、引脚或寄存器连线；实际工程须再次核对具体料号、勘误、DMA 请求映射、内存时钟和链接映射。"
      ],
      "sourceIds": [
        "rm",
        "an"
      ]
    },
    {
      "label": "03 / RECEIVE IS AN OWNERSHIP PROTOCOL",
      "title": "接收前清掉隐患，接收后丢掉旧副本",
      "paragraphs": [
        "本站拟议协议，前提是块独占完整缓存行、没有相邻对象共用，旧接收内容可丢弃，缓存已正确初始化。CPU 准备好块后，在启动 DMA 前 invalidate 这些行，避免旧脏行随后被逐出并覆盖 DMA 的新结果；若确有必须保留的旧内容，应先重新设计分区，或在 DMA 尚未启动时按用途完成 clean/invalidate，不能事后补救。",
        "移交给 DMA 后，CPU、其他任务和中断都不得读写该块。确认对应块已完成且 DMA 不再写它，再 invalidate 完整块，然后才由 CPU 读取。Arm 员工说明 Cortex-M7 可能因访问模式、相邻可缓存内存而进行推测读取，所以“代码没有主动读数组”不能替代接收完成后的 invalidate。",
        "CPU 处理结束后才把块归还给 DMA。缓存维护和启动/完成的顺序应使用目标 CMSIS 与架构要求的屏障保证，不能凭空假设普通函数调用或中断就提供全部顺序。发送路径另论：CPU 先写数据、clean 到内存并完成必要顺序，再交给 DMA 读取；不要在 DMA 已写入接收结果后 clean 旧缓存去覆盖它。"
      ],
      "sourceIds": [
        "faq",
        "arm",
        "an",
        "cmsis"
      ]
    },
    {
      "label": "04 / OWN THE WHOLE CACHE LINE",
      "title": "16 个半字是一行，半缓冲边界也要对齐",
      "formula": "缓存行 L = 32 byte；16-bit 样本每行可放 16 个\n示意：每块 96 个样本 × 2 byte = 192 byte = 6 行\n两个独立块共 384 byte；第二块起点 A + 192 仍为 32-byte 对齐\n反例：每半块 50 个样本 = 100 byte；第二半块偏移 100 mod 32 = 4 byte",
      "paragraphs": [
        "本站地址推演：若环形数组首地址 A 已对齐，每半块 100 byte，分界落在从 A+96 开始的那一行。CPU 维护前半块时会碰到 DMA 正在写的后半块；给整个数组加一个对齐声明并不能解决半块共用行。应让每次独立交接的块大小也为 32 byte 的整数倍，并把状态标志、计数器及其他对象放在块外独立缓存行。",
        "范围检查的纯算术为 start = floor(A/32)×32，end = ceil((A+N)/32)×32，维护长度 end−start。向外取整只算出受影响的行，并不授权破坏相邻对象。CMSIS 按地址 API 的长度单位是 byte，不是样本数；真实实现还须检查地址加法溢出和链接器最终布局。"
      ],
      "sourceIds": [
        "cmsis",
        "faq"
      ]
    },
    {
      "label": "05 / COMPLETION IS NOT A LOCK",
      "title": "循环 DMA 不会等 CPU 完成阅读",
      "formula": "本站假设：单通道 48,000 sample/s，每块 96 个 16-bit 样本\n块间隔 = 96 / 48,000 = 2 ms；逻辑数据量 = 96,000 byte/s\n交接延迟 + 缓存维护 + CPU 读取/复制 + 调度余量 < 2 ms",
      "paragraphs": [
        "纯预算，不是测量：若双半缓冲交替填充，某半块完成后，CPU 通常只有另一半块填满的时间窗口；必须按实际启动与重用时刻核对。示意总耗时 2.3 ms 已超出 2 ms 窗口，缓存操作再正确也会发生读写竞态。不要把完成回调视为永久拥有缓冲区的锁。",
        "拟议验收：使用块编号和采集代次记录每次移交；预算不足时，选择暂停源的受控块传输、增加真正独立且可用的缓冲块，或在窗口内复制到 CPU 私有区。超过窗口的块必须拒绝，不能靠事后再 invalidate 修复。元数据不得与 DMA 数据共用维护行，发布它仍须使用适合任务/中断模型的同步。"
      ]
    },
    {
      "label": "06 / UNPERFORMED BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下是依据文档设计的验收方法，尚未执行；没有本站实测性能、错误率或量产可靠性证据。物理 ADC 测试仅限确认安全隔离的低压台架。"
      ],
      "bullets": [
        "冻结条件：完整料号与硅修订、官方勘误、板卡、编译器、优化、HAL/CMSIS 版本、MPU/cache 配置、实际缓冲地址与 map 文件、块长度和维护范围。检查 DMA 可达性与整行独占。",
        "先以可识别序号/模式的受控搬运验证软件交接，再接 ADC 的已知低压输入与可辨识阶跃；前者不是 ADC 精度测试，后者也不能单靠波形看似正确证明没有丢块。",
        "比较专用 Normal non-cacheable 区和 cacheable 区加完整维护协议；可在受控调试配置比较关闭 D-Cache，但须正确初始化/停用，不能运行中粗暴切换或把性能变化误判为协议已修复。",
        "增加允许范围内的 CPU 内存负载和中断延迟，记录旧块、重复块、漏块、相邻哨兵破坏、ADC OVR、DMA 错误、移交到处理结束的最长时间。邻接哨兵应在独立缓存行；故意共用行仅作为软件地址反例，不推荐在实际数据上破坏性验证。 覆盖首块、停流、重启、半块边界与消费者超时。应用门限应在测试前写明：有效块身份完整、无越界修改、无未解释 DMA/ADC 错误，处理有足够时间余量；某次零异常不等于排除了低概率故障。"
      ]
    },
    {
      "label": "07 / TRANSFER THE METHOD",
      "title": "从“加一行 invalidate”改为完整交接约定",
      "paragraphs": [
        "练习一：每块 96 个 16-bit 样本改为 100 个，块长变为 200 byte，200 mod 32 = 8，第二块不再对齐。若只是把缓存维护长度向上取到 224 byte，却仍让下一块紧邻，会触碰别人的数据；应重新安排实际存储间距和 DMA 块长度，而非只改维护参数。",
        "练习二：48 ksample/s 改为 96 ksample/s，96 样本的窗口降为 1 ms。原来 1.2 ms 的处理路径即使在低速时通过，高速也不通过。缓存一致性、内存可达性与实时截止时间必须各自验收。",
        "许可与证据：本站仅链接官方文档并给出原创解释、算术和待执行的验收计划，未复制厂商图表、下载或执行项目代码。公开手册与论坛内容不等于开源软件许可；后续采用 CMSIS、HAL 或示例代码必须分别核对其实际版本与许可证。AN4839 的示例现象不构成本文 H743 ADC 系统的公开实测数据或性能保证。"
      ]
    }
  ]
}
];


/* Plain-language reading introductions. Existing evidence and detailed case objects remain unchanged. */
window.SensorCaseOverviews = {
  "ti-tipd120": {
    "problem": "用三根长导线连接电阻式温度探头时，导线电阻和两路用于测量的电流不一致，会让温度读数偏掉。",
    "method": "让信号与参考共用相关的激励，再交换两路电流、成对测量取平均，减轻共同漂移和电流不匹配；最后用标准电阻校准。",
    "boundary": "TI 用精密电阻验证了采集电路，不是完整温度探头的实测。导线匹配、探头自热和安装误差仍要另查；本站未实物复现。",
    "takeaway": "先从电路结构减少误差，再做标定；不是换一个位数更高的 ADC 就能解决。"
  },
  "adi-cn0359": {
    "problem": "测液体导电能力时，信号大小可能差很多，探头受持续单向电流影响、温度变化也会让读数漂。",
    "method": "让激励方向交替，减少电极极化；自动调整放大倍数，让信号不过小也不超量程，再结合探头参数和温度换算。",
    "boundary": "ADI 的精度曲线来自精密电阻替代测试，不保证所有液体和探头同样准确。实际溶液、温度补偿和清洁状态还需验证；本站未实物复现。",
    "takeaway": "电路测得准只是第一步，探头与被测液体的特性也属于测量系统。"
  },
  "st-an4073": {
    "problem": "输入电压明明没变，STM32 的 ADC 读数仍在抖；原因不一定只在传感器或外部电路。",
    "method": "保持输入、时钟等条件一致，对比不同缓存与预取设置，再比较平均前后的抖动和更新时间，找出更合适的组合。",
    "boundary": "ST 在指定 STM32F407 台架上看到读数分散变小，但这不等于绝对电压误差变小，也不保证别的板子同样有效；本站未实物复现。",
    "takeaway": "固件的运行活动也可能影响模拟采样；用同条件对照测试定位，不要盲目关掉所有加速功能。"
  },
  "st-adc-overrun": {
    "problem": "多通道采样时数据搬运突然停住。直接重启后，残缺的一组数据或旧缓存还可能被当成新测量交出去。",
    "method": "先区分 ADC 结果未及时搬走而溢出、DMA 搬运错误和程序处理太慢；恢复时关住触发、隔离旧数据，再从明确的首通道和新一轮编号重新采集。",
    "boundary": "这是按 STM32F407 手册与驱动推导的恢复方案，还没有板卡实测。它给出检查顺序，不承诺已经解决某块板的停流或恢复时间。",
    "takeaway": "“又有数据了”不等于“数据可信了”；必须同时恢复通道顺序、整组完整性和新旧身份。"
  },
  "ti-ads1256-mux": {
    "problem": "ADC 标着每秒输出 30,000 个结果，轮流测四路却没想象中快；刚切换通道，读出的还可能是上一通道的数据。",
    "method": "把换通道、等待信号与数字滤波稳定、读取结果分别计时，并给结果标清通道归属；按完整的一轮计算刷新率，不直接把标称速率除以四。",
    "boundary": "这是 ADS1256 文档时序加假设条件的预算，不是板测。示例加入额外等待后，四路一轮超过 1 ms，说明目标不满足，而非已经实现。",
    "takeaway": "固定一路持续采集有多快，与换路后拿到第一个可靠结果有多快，是两回事。"
  },
  "st-dma2-gpio-contention": {
    "problem": "三路 ADC 正在采样，再让定时器配合 DMA 控制 GPIO 引脚。即使 DMA 资源没有冲突，数据搬运或采样时刻仍可能出问题。",
    "method": "分开检查资源分配、芯片已知限制、总线访问路径，以及引脚改变后信号是否来得及稳定；逐项算最坏时间，而不是只看平均数据量。",
    "boundary": "这是针对 STM32F407 的文档排查与调度推演，候选改法尚未板测。不同 DMA 资源不冲突，不代表芯片并发限制已经排除。",
    "takeaway": "“配置不打架”只是第一关，还要证明数据能按时搬走、信号稳定后才采样。"
  },
  "st-m7-adc-cache": {
  "problem": "ADC 的数据搬运已经结束，程序读到的却像上一批结果；或者把数组挪到一块“快内存”后，DMA 根本写不进去。",
  "method": "先确认这个 DMA 能到达缓冲区，再按整条缓存行分块；DMA 接收前后做对应的缓存维护，明确 CPU 和 DMA 何时交接每一块。",
  "boundary": "这是按 ST 与 Arm 文档推导的 STM32H743 接收设计和验收计划，尚未做板卡实测。F7/H7 不同型号与 DMA 引擎不能直接套用；缓存正确也不能解决处理超时。",
  "takeaway": "“DMA 搬完了”不等于“CPU 已看到新数据”；内存路径、缓存可见性和块所有权都要对上。"
}
};
