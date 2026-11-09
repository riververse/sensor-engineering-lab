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

// Public documentation case, verified 2026-10-22; original seven cases unchanged.
window.SensorCases.push({
  "id": "st-center-aligned-trigger",
  "maker": "ST",
  "title": "中心对齐 PWM：一周期不一定只有一次采样请求",
  "subtitle": "STM32F407 · 比较脉冲 / OCREF 边沿 / 双更新边界 / 预装载一致性",
  "question": "ADC 已经选“上升沿触发”，为什么一轮 PWM 仍可能采两次？",
  "summary": "先辨认触发信号，再数事件；占空比与采样点也必须属于同一代配置。",
  "published": "2011-09-15",
  "revision": "RM0090 Rev 22 · 2026-05",
  "verified": "2026-10-22",
  "evidence": "厂商参考手册逐项核对 + 本站原创离散时序推演",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "debug",
    "error"
  ],
  "conditions": "限定 STM32F407、TIM2 内部时钟、中心对齐、ADC1 独立规则组单通道；无从模式、无连续转换、无注入组。示意 VDD/VDDA/VREF+ 均 3.3 V、HCLK 168 MHz、PCLK1 42 MHz、PCLK2 84 MHz、APB1 分频 4，TIM2 时钟 84 MHz；PSC=83，ARR=50，CNT 每步 1 μs，完整往返 100 μs。没有指定板卡、编译器、HAL 或运行固件版本。原始日期指手册首版，不是测试日期。",
  "sources": [
    {
      "id": "ds",
      "label": "ST DS8626 Rev 12 · §6.3.21 Table 67 / pp.135–137",
      "url": "https://www.st.com/resource/en/datasheet/stm32f407ig.pdf",
      "date": "2026-03，Rev 12；2026-10-22 核对 ADC 时钟供电条件、转换时间与外部触发延迟脚注。"
    },
    {
      "id": "rm",
      "label": "ST RM0090 Rev 22 · §§13.5–13.6 pp.399–400；§13.13.3 p.420；ADC_CCR p.430；§18.3.1 pp.595–596；§18.3.9 pp.607–610；§18.4.1 pp.624–625；§18.4.2 p.626",
      "url": "https://www.st.com/resource/en/reference_manual/rm0090-stm32f4xx-reference-manual-stmicroelectronics.pdf",
      "date": "首版 2011-09-15（修订记录 p.1704）；所核版本 2026-05，Rev 22，1741 页；核对日期 2026-10-22。"
    },
    {
      "id": "errata",
      "label": "ST ES0182 · 目标芯片勘误入口",
      "url": "https://www.st.com/resource/en/errata_sheet/es0182-stm32f405407xx-and-stm32f415417xx-device-errata-stmicroelectronics.pdf",
      "date": "2026-07，Rev 19；2026-10-22 获取官方 PDF，核对适用器件表。上板前须按完整料号与 REV_ID 复核，不据此宣称本方案已排除所有硅限制。"
    }
  ],
  "blocks": [
    {
      "label": "01 / NAME THE SIGNAL",
      "title": "“上升沿”属于哪一个信号？",
      "paragraphs": [
        "手册事实：TIM2_CR2.MMS=011 选择 Compare Pulse。它在 CC1IF 将被置位的事件上输出正脉冲，即使该标志此前已经为 1 也会输出。CMS=11 时，输出比较标志在上数和下数匹配时都产生。因此，未清标志不是可靠的触发分频办法。",
        "本站推演：令 CC1S=00、CCR1=20、CMS=11，两个匹配时刻为 20 μs 与 80 μs。每个都是独立正脉冲，各有一个上升沿。ADC1 的 EXTSEL=0110 选择 TIM2_TRGO，EXTEN=01 只选择这些脉冲的上升沿，并不把两个正脉冲变成一个。这里讨论的是 MMS=011 的 CC1 比较脉冲，不是把任意 CC 通道当成 TRGO 源。"
      ],
      "sourceIds": [
        "rm"
      ]
    },
    {
      "label": "02 / CHOOSE A WAVEFORM",
      "title": "OC2REF 的一升一降，与两个正脉冲不同",
      "formula": "完整中心对齐周期 T = 2 × ARR × (PSC+1) / fTIM\nT = 2 × 50 × 84 / 84 MHz = 100 μs\nCCR=20：上数匹配 20 μs；下数匹配 100−20=80 μs",
      "paragraphs": [
        "另一条明确路由：TIM2_CH2 配为输出（CC2S=00）、PWM mode 1（OC2M=110），CCR2=20、OC2PE=1，ARPE=1；MMS=101 选择 OC2REF。ADC1 仍选 EXTSEL=0110。稳态 OC2REF 在上数匹配处下降、下数匹配处上升；EXTEN=01 因而每完整周期得到一个请求，示意相位为 80 μs。若选 EXTEN=11，则两个边沿都请求转换。",
        "CMS=01/10/11 改变比较标志在哪个方向置位，但手册明确这些中心对齐选择不会改变 PWM OCxREF 波形。不要把 CMS 对标志的方向筛选，误当成 OC2REF 波形的边沿筛选。输出引脚极性也不是内部 OC2REF 的同义词。",
        "本例不配置实际 PWM 功率输出，不连接负载。若需输出到引脚，另核封装、复用、电气和极性。本文只证明文档中的事件路径与理想计数关系；触发同步延迟、ADC 忙状态和实际获取开始时刻尚未测量。"
      ],
      "sourceIds": [
        "rm"
      ]
    },
    {
      "label": "03 / TWO COMMIT BOUNDARIES",
      "title": "开了 preload，仍可能拼出“新占空比、旧采样点”",
      "paragraphs": [
        "手册事实：TIM2 中心对齐在顶部和底部都可生成更新事件；CCR 的预装载值在更新时转入有效寄存器。两个普通软件写入不是一个不可分割的硬件提交。关闭 CPU 中断也不会阻止定时器到达更新边界。",
        "原创反例：在采用 OC2REF 触发的方案中，让 CH1 独立表示 PWM 占空配置，CH2 表示采样位置；二者都开启预装载。旧值为 CCR1=20、CCR2=20，新值为 30、15。若 49 μs 写完 CCR1，50 μs 顶部更新，51 μs 才写 CCR2，那么下半轮有效组合为 30、20，而不是预期的 30、15。100 μs 底部才装入第二个新值。此时仍可能恰好有一个 ADC 结果，但它对应了错误的配置组合。",
        "迁移方法：为占空比、采样点和帧标签设共同配置编号，明确哪一个更新边界生效。停表重配是易审计的低速台架选择；若连续运行需要用 UDIS 防止半写入提交，必须先论证禁用和恢复更新的时序、延迟生效后果及 ADC 帧归属。本文不把这一思路当作已验证的热更新驱动，也不把 TIM1/8 的重复计数器功能套给 TIM2。"
      ],
      "sourceIds": [
        "rm"
      ]
    },
    {
      "label": "04 / COUNT REQUESTS, NOT JUST RESULTS",
      "title": "DMA 数量正常，不能反证触发没有多发",
      "formula": "比较脉冲模式：2 请求 / 100 μs = 20,000 请求/s\nOC2REF 单边沿：1 请求 / 100 μs = 10,000 请求/s\n每结果 16 bit：理想载荷分别 40 kB/s 与 20 kB/s\nADCCLK = 84 / 4 = 21 MHz\n获取 = 28 / 21 ≈ 1.333 μs；转换合计 = (28+12) / 21 ≈ 1.905 μs",
      "paragraphs": [
        "以上是原创事件和载荷算术，不是可达吞吐量实测。若 ADC 未就绪、仍忙、发生溢出或软件漏取，结果数未必等于请求数。因此要分开记录定时事件、完整转换结果、DMA 错误和帧编号。缓冲区足够大也不能修复采样相位错误。",
        "新增教学预算：ADC 公共 ADCPRE=01、12 bit、所选通道 SMP=010（28 周期），得到上述获取与转换时间。DS8626 表67在 VDDA 2.4–3.6 V 的 ADC 时钟上限为 36 MHz；本例 3.3 V、21 MHz 在此时钟条件内，不可照搬到低电压条件。模拟输入及源阻抗仍须使采样电容在 1.333 μs 内达到目标误差，不能由时钟合规推出精度合规。",
        "外部规则触发延迟还要计入：表67给出最多 2 个 ADC 周期，脚注7要求另加 1/PCLK2。本例按文档预算约 0.107 μs，因此 80 μs 请求的获取结束不晚于约 81.440 μs、转换结束不晚于约 82.012 μs。若人为假设安静区为 79.5–82.5 μs、EOC 截止为 83 μs，则该理想预算满足；这些窗口是教学假设，延迟参数为文档特性化结果，不是本站测得的板级最坏值。实际同步、噪声和运行条件须另验收。",
        "每一段获取窗口都必须落在实际电路允许的安静区内，而不只是触发点落在里面。CCR 接近 0 或 ARR 时，OCREF 波形可能退化，不能外推内部比较值的“一升一降”计数；本文所有数值推演限定 0<CCR<ARR、稳态且配置不变。"
      ],
      "sourceIds": [
        "rm",
        "ds"
      ]
    },
    {
      "label": "05 / STARTUP IS A DIFFERENT EXPERIMENT",
      "title": "先定义第一帧，再观察稳态",
      "paragraphs": [
        "待实现的启动约定：先关闭 ADC 外部触发检测、停止 TIM2；配置时钟和预装载，执行初始化 UG，再清理状态并建立已知计数方向与 CNT。ADC 与数据接收准备好后，才按经过审查的顺序开放触发和启动计数。手册要求接收触发的 ADC 时钟先启用，接收期间不随意改时钟。",
        "URS=1 只限制哪些更新来源请求中断/DMA，不等于禁止 UG 装载预装载值，也不是 ADC 触发总闸；UDIS=1 才禁止 UEV 与影子寄存器更新，但 UG 仍可重置计数器和预分频器。初始化要允许必要的装载，同时在 ADC 一侧明确关闭外部触发检测。",
        "UG、模式切换及起始 OCREF 电平不能混在稳态事件模型中。第一帧是否有效必须单独验证。此段不是完整寄存器初始化代码，未覆盖 ADC 上电时间、DMA 路由、模拟输入或任何板级驱动；不得直接用于控制功率级。"
      ],
      "sourceIds": [
        "rm"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下建议尚未执行。仅在确认安全隔离的低压台架执行，不接市电、未知开关节点或功率负载。本站没有连接硬件，也没有执行厂商固件。"
      ],
      "bullets": [
        "冻结完整芯片料号、硅修订、勘误、时钟、CMS/MMS、CCR、ADC 触发选择、固件版本与实际引脚复用；记录首帧和稳态为不同阶段。",
        "先固定配置，对比 Compare Pulse / OC2REF，以及 ADC 上升沿 / 双边沿。用经核对的观察信号记录相位与频次；GPIO 中断翻转带有软件延迟，不能冒充实际 ADC 获取边沿。",
        "在 ADC 可完成转换且数据可及时接收的条件下，比较预期请求数和结果数。另查 ADC OVR、DMA 错误与应用漏帧，不以“平均速率正常”作为相位正确的判据。",
        "验证跨顶部/底部边界的更新，检查配置编号和采样位置是否成对生效。先用纯软件模型复现半更新反例，再制定安全硬件测试；不在有负载的系统故意制造混合配置。应用验收门限应包含首帧规则、每周期请求数、配置一致性和获取窗口余量。跨采样点、占空比与负载范围验证；不能以一个 CCR 值通过推断全范围通过。"
      ]
    },
    {
      "label": "07 / TRANSFER THE METHOD",
      "title": "学的是事件身份，不是一个“万能配置”",
      "paragraphs": [
        "练习一：PSC 不变、ARR 改为 100、CCR 改为 30。完整往返为 200 μs，两个比较位置为 30 与 170 μs；Compare Pulse 的请求率变为 10 k/s，OC2REF 上升沿为 5 k/s。不能沿用边沿对齐的 ARR+1 公式计算这里的完整往返。",
        "练习二：如果两次预装载写入都在 50 μs 之前完成，顶部可以提交同一代数值；如果都在顶部之后，需明确等到底部提交。只把写入“尽量靠近”不能替代最坏时间证明。",
        "许可与证据：本文为原创解释、离散算术、反例及待执行验收；仅链接 ST 官方手册，不复制厂商图表、源码或固件。公开可读不代表开源许可，引用文档版权仍属权利人。没有厂商或本站完整系统实测，也没有已验证性能、良率或量产可靠性结论。"
      ],
      "sourceIds": [
        "rm"
      ]
    }
  ]
});
window.SensorCaseOverviews["st-center-aligned-trigger"] = {
  "problem": "PWM 一轮里，ADC 可能被叫了两次；即使结果数量对，采样位置也可能配上上一轮的设置。",
  "method": "先分清比较事件产生的短脉冲和 PWM 内部波形的边沿，再数每轮请求；把占空比、采样点和结果编号作为一组提交。",
  "boundary": "这是 STM32F407 手册核对与原创时序反例，尚未板卡实测，不是可直接部署的驱动。首次启动、输入建立和最坏运行时序仍需验证。",
  "takeaway": "“上升沿触发”没有说明一轮会触发几次；先弄清是哪条信号，再保证整组配置同时生效。"
};


// Original diagnostic teaching addition; vendor bench evidence is labeled separately.
window.SensorCases.push({
  "id": "adi-mux-order-memory",
  "maker": "ADI",
  "title": "换了通道，为什么读数还记得上一通道？",
  "subtitle": "AN-2573 / CN-0292 · 模拟建立 / 扫描顺序 / 偏差与噪声",
  "question": "单通道读得又稳又准，为什么一轮扫描后每路都稳定地偏了一点？",
  "summary": "用固定通道与交替扫描的对照，识别前一通道留下的建立误差；不要只比较直方图宽度。",
  "published": "2014-11",
  "revision": "AN-2573 Rev. A · 2024-04；前身 CN-0292",
  "verified": "2026-10-23",
  "evidence": "厂商参考电路台架对照 + 本站原创单极模型与诊断练习",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "driver",
    "adc",
    "error",
    "debug"
  ],
  "conditions": "厂商案例器件链为 ADA4096-4 → ADG1204 → ADA4898-1 → AD8475 → AD7176-2，外部复用、顺序采集；AD7176-2 是 Σ-Δ ADC，不是 SAR。文档版本为 AN-2573 Rev. A；未锁定台架固件、编译器、原始逐点数据或板卡修订。本文不配置 MCU、ITR/TRGO、DMA 或寄存器脚本。后文 3.3 V、16 bit、0.4 μs 均为独立教学假设，不是这块参考电路的参数。",
  "sources": [
    {
      "id": "report",
      "label": "ADI AN-2573 Rev. A · pp.2–4：版本、信号链与扫描对照",
      "url": "https://www.analog.com/media/en/technical-documentation/app-notes/an-2573.pdf",
      "date": "首版 2014-11；Rev. A 2024-04。p.2 明确由 CN-0292 转换，删除旧评估/安装章节；本次核验 2026-10-23。"
    },
    {
      "id": "settling",
      "label": "ADI Analog Dialogue 52-04 · 输入端电荷共享与驱动稳定性",
      "url": "https://www.analog.com/media/en/analog-dialogue/volume-52/number-2/performance-optimization-of-multichannel-data-acquisition-dac-systems.pdf",
      "date": "原始出版 2018-04（PDF 页眉），不是近期器件发布；核验 2026-10-23。"
    },
    {
      "id": "switch",
      "label": "ADI AN-1024 Rev. 0 · pp.1–3：开关切换与建立分开计算",
      "url": "https://www.analog.com/media/en/technical-documentation/app-notes/an-1024.pdf",
      "date": "Rev. 0；文末文档标识 7/09，即 2009-07；核验 2026-10-23。"
    }
  ],
  "blocks": [
    {
      "label": "01 / A CONTROLLED COMPARISON",
      "title": "两张直方图都很窄，均值却移动了",
      "paragraphs": [
        "厂商台架：AN-2573 p.4 比较固定 CH1 与四通道 +9.6 V / −9.6 V 交替扫描；各取 1,000 个 CH1 样本。42 kSPS 通道切换、4 μs 转换延迟时，均呈现优于 16 bit 的无噪声码分辨率，但扫描后的均值偏移约 300 μV。此处是厂商报告，不是本站复测。",
        "工程解读：直方图宽度描述一组读数有多分散，中心移动描述两种运行方式的系统性差异。窄而偏的分布不能靠“再平均更多点”证明变准；更不能把无噪声码分辨率当作绝对准确度。厂商未提供本页可复核的逐点数据，本文不推断所有温度、通道或板卡都有同一偏差。"
      ],
      "sourceIds": [
        "report"
      ]
    },
    {
      "label": "02 / THE ANALOG MEMORY",
      "title": "数字选通已完成，模拟节点还在追赶",
      "paragraphs": [
        "原理背景：切换时，公共节点上的电荷可能与新通道电容重新分配；运放也要恢复。ADI 2018 年文章提醒，加大储能电容虽可减小瞬间跳动，也可能加重驱动负载与振铃。AN-1024 将数字切换时间与模拟建立时间分开；“开关响应快”不等于整条信号链已进入误差带。",
        "本站设计判断：至少分别检查通道源端、MUX 公共端、ADC 驱动端和 ADC 输入自身。高阻传感器、滤波器、运放、参考与采样架构都会改变结果；单一 RC 只是用来建立直觉，不是完整 SPICE 或芯片模型。对 SAR 可讨论获取窗口；对本例 Σ-Δ 还须独立处理数字滤波与通道切换，不能互套等待时间。"
      ],
      "sourceIds": [
        "settling",
        "switch"
      ]
    },
    {
      "label": "03 / AN ORIGINAL SMALL MODEL",
      "title": "先把“上一通道的影子”算出来",
      "formula": "原创单极模型：a = exp(−t/τ)\ny[n] = x[n] + a × (y[n−1] − x[n])\nLSB = VFS / 2ᴺ；仅给建立残差分配 ε = LSB/2\n单次已知阶跃：t ≥ τ × ln(|y初值−x新值|/ε)，低于门限时取 0",
      "paragraphs": [
        "符号：x 是本次输入（V），y 是采样终点电压（V），t 是该模型可用的建立时间（μs），τ 是时间常数（μs），a 无单位。此假设要求一个稳定的一阶节点在通道之间保留电压，不包含量化、运放压摆、振铃、电荷注入或 Σ-Δ 数字滤波。它不是 AD7176-2 的内部模型。",
        "合成例子：取 VFS=3.3 V、N=16、τ=0.4 μs、t=2 μs，输入在 1 V 与 3 V 交替。稳态两路分别约 1.013386 V 与 2.986614 V，每路偏差约 13.386 mV，约 265.83 LSB。没有加入随机噪声，因此重复读数仍可很稳定，但明显不准确。",
        "若上一节点恰好已在 1 V，下一目标为 3 V，半 LSB=25.177 μV，单次阶跃所需建立时间约 4.513 μs。这只预算一项残差；即使满足，也不能声称总误差小于半 LSB。稳态交替的起点不等于每次都已完全建立，所以上面的稳态值使用递推，而非重复套用同一个固定初值。"
      ]
    },
    {
      "label": "04 / CHANGE THE ORDER, NOT THE CALIBRATION",
      "title": "用扫描顺序做诊断，不先重写标定系数",
      "paragraphs": [
        "本站待验证方法：保持每路真实输入、供电、增益和采样配置不变，对比 A→B→C、C→B→A 与固定 B。按“当前通道、前驱通道、有效建立时间”分组统计均值和离散度。若 B 的均值随前驱电压方向变化，而固定 B 较稳定，应优先检查动态建立；这只是线索，不是排除了接地、参考或数字串扰。",
        "可以把电压相近的通道放在一起减少跳变，但这不是最坏情况证明：实际传感器输入会变化，循环末尾到开头也是一次切换。增加一次丢弃转换同样有条件，必须验证器件是否保留所需状态以及下一点是否真的收敛，不能把“丢一帧”当所有 ADC 的处方。",
        "为结果保留真实通道标签和采样时刻。MUX 已切到下一路时读出的数据，未必属于此刻的 MUX_SEL。顺序三通道即使装在一个软件帧中，也不是三路同时测量。本文不提供可直接使用的定时器连线或数据重排固件。"
      ]
    },
    {
      "label": "05 / PAY FOR THE GUARD TIME",
      "title": "建立时间省下来之前，先算清会丢掉什么",
      "formula": "独立教学调度：三通道严格串行、无重叠\n每路：0.2 μs 切换 + 4.513 μs 建立 + 1 μs 转换/读取\nTframe = 3 × (0.2 + 4.513 + 1) ≈ 17.139 μs\n每路更新率 ≈ 58.35 kSPS；首末采样时刻相差约 11.426 μs",
      "paragraphs": [
        "这组数值完全是假定的顺序采样合同，不是 AN-2573 的时序，也不是任何 MCU 可达速率。若目标为每 15 μs 得到完整三路新帧，此预算不满足；不能因为 ADC 自称 1 MSPS 就直接判定通过。总输出数率与每路更新率必须分开。",
        "转换期间能否提前切下一路、建立能否与转换重叠，要由所选 ADC 的保持/隔离结构、控制时序和允许的输入变化决定。未经核验不能从上述串行总和擅自减去重叠时间。对于快速变化的量，还要对首末采样时差建立误差预算，而非只追求帧率。"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。只在确认安全隔离的低压台架操作；原参考电路有双极性输入能力，不表示 MCU 引脚可直接接负电压。换接前断电，先确认每级输入范围及探头接地。"
      ],
      "bullets": [
        "冻结板卡/器件修订、供电、参考、MUX/ADC 模式、源阻抗、滤波器、固件版本、扫描表及有效采样时刻；保留原始码，不先套新标定。",
        "固定被观察通道；改变前驱通道电平、正反扫描顺序和等待时间。保持采样样本数一致，记录均值变化、标准差、最大残差与异常计数。",
        "观察 MUX 选通信号与关键模拟节点，确认建立后持续留在规定误差带内；探头输入电容可能改变本来要测的节点，需记录探头与测量带宽。",
        "在应用允许的温度、输入跳变、源阻抗和业务负载范围内复验。用未参与调参的输入组合验收误差、每路新样本率、首末时差和丢样，而非只看一张平滑曲线。"
      ]
    },
    {
      "label": "07 / TRANSFER AND CHECK",
      "title": "带走的是对照方法，不是某个固定等待值",
      "paragraphs": [
        "练习一：仍取 τ=0.4 μs，建立窗口改为 5 μs。交替 1 V/3 V 的模型稳态偏差约 7.453 μV，即 0.148 LSB，落入所分配的半 LSB 预算；若 τ 翻倍为 0.8 μs，偏差约 3.853 mV，即 76.53 LSB，又失败。请说明为什么固定等待值不能脱离源阻抗与负载。",
        "练习二：3 V→3 V 的稳态跳变误差为零，不证明 1 V→3 V 同样合格。比较固定通道、同电平多通道与大跳变多通道，各自隔离了哪些问题？顺序优化还遗漏了循环边界吗？",
        "证据与许可：厂商台架数字仅属于 AN-2573 所述条件；2018 年文章中的放大器模型结果不冒充本站或第三方实物测试。本文只作原创解释、合成算术和待执行验收，仅链接官方文档，不转载图表或运行厂商代码。文档版权归 ADI；公开可读不等于获得软件开源许可证。新内容保持待学习。"
      ]
    }
  ]
});
window.SensorCaseOverviews["adi-mux-order-memory"] = {
  "problem": "单通道测量很稳定，多通道轮流读后却各自偏了一点；只看噪声大小，可能看不见这个偏差。",
  "method": "先比较固定通道与大电压交替扫描，再改变扫描顺序和等待时间，把前一通道留下的动态误差单独找出来。",
  "boundary": "厂商提供了特定参考电路的对照数据；本站只有独立教学模型，未实物复现，也没有可直接烧录的配置。",
  "takeaway": "切换完成、输入建立完成和读到有效新数据是三件事；直方图很窄，不能证明没有串扰。"
};

// Public-source timing case; no device reproduction claimed.
window.SensorCases.push({
  "id": "ti-ads131m04-time-identity",
  "maker": "TI",
  "title": "同时采样之后，时间戳该贴在哪里？",
  "subtitle": "TIDA-010037 / ADS131M04 · 通道相位 / 滤波群延迟 / 数据身份",
  "question": "四路数据同一帧读回来，为什么仍不能直接说它们代表“现在”？",
  "summary": "把传感器相位、数字滤波时间中心、数据就绪和主机接收分开记录。",
  "published": "2019-03",
  "revision": "TIDUEM8B · 2021-02；SBAS890D · 2021-05",
  "verified": "2026-10-24",
  "evidence": "厂商成熟参考设计与台架结果 + 器件手册 + 本站原创时域模型",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "calibration",
    "error",
    "debug"
  ],
  "conditions": "版本：TIDUEM8B / SBAS890D。TIDA-010037 使用 ADS131M04 + MSP432P4111、CT 电流前端；HR 高分辨率模式，CLKIN 与 SPI 时钟均为 8.192 MHz，fMOD = CLKIN/2 = 4.096 MHz，OSR 512，输出 8 kSPS；DRDY 通知主机取数。参考设计用软件相位补偿，不是硬件 PHASE 校正效果实测。本站未锁定测试固件构建或逐样本原始记录，不提供可烧录配置。",
  "sources": [
    {
      "id": "design",
      "label": "TI TIDUEM8B · Table 1-1、§2.3.2.3.3、§3 台架测试",
      "url": "https://www.ti.com/lit/pdf/TIDUEM8",
      "date": "PDF 标明首发 2019-03、修订 2021-02；产品页日期不同，本案例以 PDF 为准。"
    },
    {
      "id": "datasheet",
      "label": "TI SBAS890D · §§8.3.5–8.3.7、8.3.10、8.5.1.4、8.5.2；式(5)(6)",
      "url": "https://www.ti.com/lit/ds/symlink/ads131m04.pdf",
      "date": "首发 2019-03；Rev. D 2021-05。"
    },
    {
      "id": "project",
      "label": "TI TIDA-010037 · 官方参考设计入口",
      "url": "https://www.ti.com/tool/TIDA-010037",
      "date": "核验 2026-10-24；不是近期新发布案例。"
    }
  ],
  "blocks": [
    {
      "label": "01 / THE REAL CONSTRAINT",
      "title": "同时采样没有消除传感器自己的相位",
      "paragraphs": [
        "厂商方案：独立 ADC 加主机处理电压、电流测量。指南将相位补偿分成整样本延迟与软件插值，并给出带校准的台架结果；硬件相位校正是另一条实现路线，不是该测试结果的直接证明。",
        "本站分析：同一时刻进入 ADC 的两个信号，可能已在不同传感器和模拟滤波器中经历不同延迟。把数据放入同一结构体，只统一了软件包装，没有统一被测物理量的时间。对于功率等需要跨通道相乘的结果，误差可能主要来自相位，而非单路幅值。"
      ],
      "sourceIds": [
        "design"
      ]
    },
    {
      "label": "02 / FOUR DIFFERENT TIMES",
      "title": "先给四个时间起不同名字",
      "paragraphs": [
        "器件机制：PHASE 以调制器时钟为步长改变通道样本窗口。合法范围随 OSR 变化：OSR≤1024 时为 −OSR/2 至 OSR/2−1；更高 OSR 限于 −512 至 511。OSR 512 对应 −256 至 255；不是所有速率都能使用同一范围。相位配置也影响 DRDY。重新同步后仍要处理滤波建立，不能把刚出现的数据一律视为有效。",
        "本站接口建议：分别保存输入时间模型、数据就绪时刻、传输完成时刻和应用消费时刻。前者是带假设的估计，后三者是可以观察的事件，不应共用一个含糊的 timestamp 字段。",
        "对连续 Σ-Δ 采集，输出来自一段时间内的加权历史，而不是 MCU 发出一次命令后瞬间取得的电压。SYNC 用于对齐过程，不应未经验证当作普通 SAR 的逐点启动脉冲。"
      ],
      "sourceIds": [
        "datasheet"
      ]
    },
    {
      "label": "03 / ORIGINAL FILTER MODEL",
      "title": "125 μs 更新一次，不代表只看过去 125 μs",
      "paragraphs": [
        "以上是本站对理想 sinc³ 的数学推导，不是板卡端到端延迟实测。单个长度 N 的对称滑动平均，其权重中心距最后一个输入点为 (N−1)/2 个输入周期；三个串联，时间中心相加。模型对应手册 §8.3.7.2 式(6)的滤波器，不含额外处理。",
        "因此，稳态更新周期、群延迟和阶跃完全建立是不同指标。将更新率取倒数，只得到输出间隔，不能得到一个新物理事件何时完整反映到输出。",
        "不能直接从主机接收时间减去这个群延迟。还必须明确器件输出对应哪一组调制器样本、通道相位配置、前端传递函数，以及 DRDY 到读取完成的时间。切换滤波模式或启用其他处理后，应重新建立模型。"
      ],
      "formula": "独立理想模型：三个长度 N 的滑动平均串联\n支撑长度 L = 3(N − 1) + 1\n群延迟 τg = 3(N − 1) / (2fMOD)\nN = 512，fMOD = 4.096 MHz\n输出周期 = 125 μs；τg ≈ 187.134 μs",
      "sourceIds": [
        "datasheet"
      ]
    },
    {
      "label": "04 / PHASE ERROR WITHOUT NOISE",
      "title": "没有随机噪声，功率仍可能偏",
      "paragraphs": [
        "这是独立合成算术，不是参考板性能。例中约定额外时间误差令相角增大；若方向相反，误差方向也改变。不要据此直接推断 PHASE 寄存器应写正值还是负值。",
        "两路各自的 RMS 可以仍然正确，跨通道乘积却错了。把两路共同延迟同样的时间，稳态相对相位可以不变，但对外部事件的绝对时序仍会落后。相对对齐与绝对时间标定必须分别验收。",
        "固定时间修正只适合被修正误差可近似为固定延迟的频段。只在一个频率调准，不能证明带谐波的宽带信号也准确。"
      ],
      "formula": "本站假设：50 Hz 正弦，真实电压电流相差 60°\n另加入 Δt = 32 / 4.096 MHz = 7.8125 μs 的相对时间误差\nΔφ = 360° × 50 × Δt = 0.140625°\n功率相对误差 = cos(60° + Δφ) / cos(60°) − 1 ≈ −0.4254%"
    },
    {
      "label": "05 / BUILD A MEASUREMENT CONTRACT",
      "title": "先让每个数据带着自己的身份",
      "paragraphs": [
        "本站实施建议：每批数据保存配置代号、通道号、连续序号、时钟与 OSR、相位修正来源、有效状态，以及可获得的 DRDY 和接收时间。把“测到了什么”和“什么时候收到”分开。",
        "配置改变和重新同步是时间模型的分界点。按具体器件章节确认有效数据条件，在记录中显式标出过渡区；不要通过删掉异常数值来掩盖状态转换。",
        "软件补偿与硬件补偿先二选一建立基线，再研究组合方式。未经核验同时开启两种补偿，可能把同一个误差修正两遍。缓冲索引偏移也要处理启动缺样与末尾缺样，不能靠循环数组静默拼接不同批次。"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下测试尚未执行。仅使用确认安全隔离、满足 ADC 输入范围的低压信号源。原电表参考设计涉及危险电压；此练习不提供市电接线或带电调试步骤。"
      ],
      "bullets": [
        "冻结硬件版本、时钟、OSR、增益、模拟滤波、相位设置和软件构建；确认两路输入幅度与共模范围。先给两路同源正弦，用相同窗口估计相对相位；交换输入路径，区分通道差异与线缆或前端差异。",
        "记录 DRDY、片选、传输结束等可观察事件。改变主机负载，检查接收抖动是否变化，而相对输入相位是否保持；软件中断翻转不是输入获取边沿。",
        "只在允许范围内逐步改变相位设置，验证方向、量化步长、范围和配置切换后的有效帧。保留修正前后数据，不只保存校准后的功率。",
        "用未参与校准的频率和幅度复验，并检查序号连续性、丢帧和过渡区。验收门限来自应用预算，不直接照抄厂商参考板的最佳结果。"
      ]
    },
    {
      "label": "07 / TRANSFER AND CHECK",
      "title": "迁移的是时间合同，不是一个延迟常数",
      "paragraphs": [
        "练习一：仅在上述理想模型中把 N 改为 1024，输出周期变为 250 μs，群延迟约 374.634 μs。说明为什么更新率减半不能自动推出所有端到端延迟恰好翻倍。",
        "练习二：两通道共同增加 20 μs 接收延迟，但输入数据与配对序号不变。稳态跨通道功率是否必然变化？若把每路各自接收时刻错当输入时刻，又会制造什么假相位？",
        "证据边界：厂商公开台架支持特定参考电路的测量结果，不构成本站时间戳设计或硬件相位校正方案的实物验证。本文没有认证、量产可靠性或全温精度结论。",
        "许可：本文为原创说明、合成算术与待执行实验，只链接官方文档，不转载图表、源码或固件。公开可读不等于开源授权；文档版权归相应权利人。新内容保持待学习。"
      ]
    }
  ]
});
window.SensorCaseOverviews["ti-ads131m04-time-identity"] = {
  "problem": "数据同时读到，不代表被测信号来自同一物理时刻；两路各自很准，相乘仍可能偏。",
  "method": "区分传感器相位、滤波时间中心、数据就绪与主机接收；先做同源对照，再验证补偿和数据配对。",
  "boundary": "厂商参考设计采用软件补偿并有台架结果；本站时间模型和验收清单未实物复现，不提供市电实验或可烧录驱动。",
  "takeaway": "同时采样解决了一类时差，不会自动给出正确时间戳。"
};

// Triple ADC frame identity: original explanation and model; not board reproduction.
window.SensorCases.push({
  "id": "stm32f407-triple-simultaneous-identity",
  "maker": "ST",
  "title": "三路同时采到了，为什么内存里还会认错通道？",
  "subtitle": "STM32F407 · 三 ADC regular simultaneous / CDR / DMA mode 1",
  "question": "同一次触发产生三个样本，怎样保住它们的通道身份与帧边界？",
  "summary": "用主 ADC 的共同触发消除有意错相，再用 DMA 数据契约证明每个数来自谁。",
  "published": "2026-05-04",
  "revision": "RM0090 Rev 22 · 2026-05；ES0182 Rev 19 · 2026-07",
  "verified": "2026-10-25",
  "evidence": "厂商成熟外设机制与官方手册 + 本站原创身份/预算模型；不是公开台架性能复现",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "error",
    "debug"
  ],
  "conditions": "对象限定 STM32F407，三 ADC regular simultaneous、各一项规则序列、相同采样时间、12 位右对齐、外部定时触发，禁止 injected。数值预算是假设 fADC=21 MHz、采样56周期、20 kframe/s 的教学配置，并非已验证板卡。板卡封装、引脚和前端未冻结，不提供直接接线或可烧录配置。published 表示所核验手册版本日期，不表示技术首次发表。",
  "sources": [
    {
      "id": "manual",
      "label": "ST RM0090 Rev 22 · §§13.5、13.9、13.9.2、13.13.16；Table 44/68",
      "url": "https://www.st.com/resource/en/reference_manual/rm0090-stm32f405415-stm32f407417-stm32f427437-and-stm32f429439-advanced-armbased-32bit-mcus-stmicroelectronics.pdf",
      "date": "2026-05；修订表 04-May-2026。2026-10-25 直接核验 PDF，非搜索缓存 Rev21。"
    },
    {
      "id": "errata",
      "label": "ST ES0182 Rev 19 · §§2.2.19、2.5.1 与芯片修订适用表",
      "url": "https://www.st.com/resource/en/errata_sheet/es0182-stm32f405407xx-and-stm32f415417xx-device-errata-stmicroelectronics.pdf",
      "date": "2026-07；修订表 17-Jul-2026；核验 2026-10-25。"
    },
    {
      "id": "legacy",
      "label": "ST AN3116 Rev 1 · §2：旧代双 ADC 资料的迁移边界",
      "url": "https://www.st.com/resource/en/application_note/cd00258017-stm32-s-adc-modes-and-their-applications-stmicroelectronics.pdf",
      "date": "2010-03-02；此应用笔记不是 F407 三 ADC 数据打包依据。"
    }
  ],
  "blocks": [
    {
      "label": "01 / THE REAL CONSTRAINT",
      "title": "同时采样、独立错相和单 ADC 扫描是三种问题",
      "paragraphs": [
        "已有独立错相方案把三路采样安排在不同时间；本例恰好相反：希望三个不同输入共享一次采集时刻。单 ADC 扫描三个通道仍是依次取得数据，不能因一个数组含三项就叫同时采样。",
        "共同触发不等于零模拟误差。不同前端的群延迟、源阻抗和采样保持建立仍需验收；本例只解决明确的触发关系和软件身份，不声称跨通道绝对零偏斜。"
      ]
    },
    {
      "label": "02 / MASTER AND SLAVES",
      "title": "一个主触发，不是给三个 ADC 各发一次软件命令",
      "paragraphs": [
        "RM0090 规定由 ADC1 规则组的 EXTSEL 选择外部事件，并把同步触发送到 ADC2/3。本例使用 MULTI=10110；各 ADC 一项序列、相同采样时间，禁用 injected，定时逐帧而非启动后自由连续运行。",
        "表68列出 TIM2_TRGO 对应 EXTSEL=0110；表44列出 ADC1 的 DMA2 Channel 0 Stream 0/4。这里只证明片内路由存在，不替代板卡资源冲突、定时器时钟和引脚检查。",
        "AN3116 Rev1 属于早期双 ADC 语境，甚至说明 ADC3 独立。不能把其中数据寄存器或时钟数字搬到 F407；本例以 RM0090 对应章节为准。"
      ],
      "sourceIds": [
        "manual",
        "legacy"
      ]
    },
    {
      "label": "03 / DATA IDENTITY",
      "title": "mode 1 是 ADC1、ADC2、ADC3 逐项，不是三路装进一个字",
      "paragraphs": [
        "本例只用 common CDR 的 DMA mode 1：每次请求一项半字，三项构成一帧。缓冲解释为 [A0,B0,C0,A1,B1,C1,…]，索引3k+r的r代表ADC身份，不代表先后采样时刻。",
        "手册一致性警告：Rev22 p405 与 p430 描述逐半字，p408 却仍称三次32位传输请求。本教学模型按前两处的 mode1 半字语义建立，必须在台架核对 DMA PSIZE/MSIZE、NDTR 和实际缓冲跨度，不把文字矛盾藏起来。",
        "mode2 的三ADC轮转配对属于 interleaved，不能当作本例优化开关；regular simultaneous 使用 mode2 的适用条件是双ADC。不要把DMA搬运次序误解成三个模拟采样故意错开。"
      ],
      "formula": "mode1：uint16 样本流 → 每帧3项 → 每帧6字节\n双半缓冲若每半含N帧：总长度6N项，每半3N项\n例如N=64：总384项=768字节；每半192项=384字节",
      "sourceIds": [
        "manual"
      ]
    },
    {
      "label": "04 / ORIGINAL TIMING BUDGET",
      "title": "计算并行采集时间，不把三次转换相加",
      "paragraphs": [
        "本站假设 fADC=21 MHz，12位、采样56周期。单 ADC 占用(56+12)/21 MHz≈3.238 μs；三路并行时仍以最长一路占用作为采集预算，不是9.714 μs。50 μs帧周期留下约46.762 μs算术余量，但尚未扣除触发同步、DMA争用与应用处理。",
        "20 kframe/s得到每路20 ksample/s，三路总计60 ksample/s；mode1有效载荷120 kB/s。该数字不等于总线事务占用，也不等于峰值突发带宽。每半64帧给消费者3.2 ms名义处理窗口，必须测最坏路径而不是平均耗时。"
      ],
      "formula": "Tframe = 1/20,000 = 50 μs\nTadc = (56+12)/21 MHz ≈ 3.238 μs\n载荷 = 20,000 × 3 × 2 = 120,000 B/s\n半缓冲时间 = 64 / 20,000 = 3.2 ms"
    },
    {
      "label": "05 / FAILURE AND RECOVERY",
      "title": "数值看起来合理，仍可能已错了一整列",
      "paragraphs": [
        "原创模型用 A、B、C 三个不重叠数值区间和帧号编码检查解包。删掉一个样本后，后续3k分组会全部错位；没有计数、配置代号和有效状态，仅凭波形平滑可能发现不了。模型标签只供离线测试，真实ADC不会自动附带通道号。",
        "RM0090 说明多ADC发生overrun可停止DMA请求。建议故障后先停止触发、保存错误状态并丢弃不完整帧，按所用驱动的已核验流程重新建立ADC/DMA和帧相位，不能只清标志就接着拼。循环DMA与持续DMA请求是不同条件。",
        "冻结芯片REV_ID并核对ES0182。转换中改序列有专门限制；DMA2的AHB/APB2并发问题也有明确受影响路径，不能笼统宣称所有ADC→SRAM传输都会损坏。配置改变应作为新采集段。"
      ],
      "sourceIds": [
        "manual",
        "errata"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下均尚未执行。仅用满足实际ADC输入范围的安全低压信号；封装、引脚、模拟前端未核验，本页不提供直接接线。台架通过前不得把模型测试写成硬件复现。"
      ],
      "bullets": [
        "冻结板卡、芯片REV_ID、固件构建、时钟树、触发源、采样时间、CDR地址及DMA数据宽度。给三个不同输入不同稳定电平，核验每三项的通道次序、NDTR单位及缓冲边界，专门检查手册宽度表述差异。",
        "经三条独立且已验证的模拟路径注入同源低压波形，不让多个ADC同时采同一个物理ADC通道。比较相位，交换路径区分前端与转换器差异；DMA回调GPIO不代表采样保持边沿。",
        "观察定时事件与缓冲完成时间，逐步增加受控CPU/DMA负载，记录ADC overrun、DMA错误、丢帧及最坏半缓冲处理时间；验收门限事先来自应用预算。",
        "在低速安全条件测试停止、重启与错误恢复，确认第一帧重新从ADC1开始且没有旧半帧混入；以不同幅度/频率复验，保留失败记录和原始码，不只保存成功截图。"
      ]
    },
    {
      "label": "07 / TRANSFER AND CHECK",
      "title": "迁移的是采集合同，不是某个 HAL 例程名",
      "paragraphs": [
        "练习一：仅把一个ADC采样时间改成144周期，最长占用成为156/21 MHz≈7.429 μs；原帧周期能容纳，不代表三路采样窗口仍等价。应重新核验有效时刻和前端建立。",
        "练习二：缓冲总长只取3N项，N为奇数时，半传输边界能否落在完整三元组后？说明为什么把“总长可被3整除”当成唯一条件还不够。",
        "许可与证据：本站原创解释、预算和离线数据模型，未执行候选厂商代码、未转载图表。官方资料版权归ST；公开可读不是软件开源许可。三ADC机制成熟不等于本站已完成板卡复现，状态保持待学习。"
      ]
    }
  ]
});
window.SensorCaseOverviews["stm32f407-triple-simultaneous-identity"] = {
  "problem": "三路共享一次触发，内存里却仍可能把通道或帧配错。",
  "method": "用ADC1主触发建立同时采集，用CDR的mode1逐项顺序建立数据身份，并用合成失样检验帧边界。",
  "boundary": "限定F407三ADC规则同时模式；手册宽度表述差异明确保留，未本站实物复现，不提供直接接线或可烧录配置。",
  "takeaway": "采样同时不等于搬运同时；每个数必须知道自己属于哪个ADC、哪一帧和哪套配置。"
};

// Original reference-drive case; prior case bytes retained unchanged.
window.SensorCases.push({
  "id": "adi-sar-reference-burst",
  "maker": "ADI",
  "title": "直流参考很稳，为什么一串采样越读越偏？",
  "subtitle": "AN-931 · SAR 参考驱动 / 突发负载 / 电荷补给",
  "question": "参考电压的万用表读数正确，能否证明每次逐位转换都有足够稳定的标尺？",
  "summary": "先区分输入建立与参考建立，再用突发、连续和不同速率的原始序列定位参考驱动问题。",
  "published": "2008-06",
  "revision": "AN-931 Rev. 0 · 2008-06；Analog Dialogue 47-06 · 2013-06；AD7980 Rev. G · 2021-01",
  "verified": "2026-10-26",
  "evidence": "厂商应用笔记台架比较 + 数据手册 + 本站原创电荷补给模型",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "reference",
    "adc",
    "error",
    "debug"
  ],
  "conditions": "厂商台架对象为 AD7686，500 kSPS，参考电容22 μF；比较参考驱动与连续/突发采集。模型另用 AD7980 的典型平均参考电流作为量级锚点，不把两款ADC混为同一台架。硬件、固件版本与逐点原始数据未完整公开；本站无板卡连接、无供应商代码执行，也没有新增MCU路由或可烧录配置。",
  "sources": [
    {
      "id": "bench",
      "label": "ADI AN-931 Rev. 0 · pp.2–4 / Figures 2–7",
      "url": "https://www.analog.com/media/en/technical-documentation/app-notes/an-931.pdf",
      "date": "2008-06（末页 AN06943-0-6/08）；核验2026-10-26"
    },
    {
      "id": "drive",
      "label": "ADI Analog Dialogue 47-06 · Voltage Reference Design for Precision Successive-Approximation ADCs",
      "url": "https://www.analog.com/media/en/analog-dialogue/volume-47/number-2/articles/precision-successive-approximation-adcs.pdf",
      "date": "2013-06；Alan Walsh；核验2026-10-26"
    },
    {
      "id": "datasheet",
      "label": "ADI AD7980 Rev. G · Tables 2/3、p.18、p.25",
      "url": "https://www.analog.com/media/en/technical-documentation/data-sheets/ad7980.pdf",
      "date": "首版2007-08；Rev. G 2021-01；核验2026-10-26"
    }
  ],
  "blocks": [
    {
      "label": "01 / THE REAL CONSTRAINT",
      "title": "输入已经保持，不代表参考也被保持",
      "paragraphs": [
        "问题：稳定输入在连续采样时似乎正常，停一会再采一串却出现斜坡或异常码。先把时间顺序留下，不要直接把全部样本做成一个直方图；直方图会隐藏误差是否总发生在突发开始或结束。",
        "方法：把参考驱动看作需要补充电荷的动态节点，而不是一只理想电压源。输入采样电容建立属于采集相位；参考节点还参与SAR转换的逐位比较。前面的MUX残留案例解决“输入从谁切到谁”，本例解决“转换开始后，标尺是否还稳定”。"
      ],
      "sourceIds": [
        "bench"
      ]
    },
    {
      "label": "02 / VENDOR EVIDENCE",
      "title": "厂商确实做过比较，但不是本站的板测",
      "paragraphs": [
        "AN-931使用AD7686、500 kSPS和22 μF参考电容，突发定义为闲置后采8192点。Figures 2–4比较ADR121/ADR365的时间序列；Figure 5在ADR365后加AD8031缓冲，展示改善。这个结论只属于文中条件，不是所有低功耗参考都不能用。",
        "本文不从图片估计新的噪声指标，也不宣称复现原始曲线。文章未给可独立重算的逐点文件；厂商台架、下文AD7980数据和本站假想RC模型严格分开。",
        "2013年文章对AD7980参考电流的观测采用500 Ω串联检测电阻，展示约2.5 mA峰值。那是电流观察方法，不是建议在生产参考路径串500 Ω；峰值也不是手册的平均电流。"
      ],
      "sourceIds": [
        "bench",
        "drive"
      ]
    },
    {
      "label": "03 / TWO DIFFERENT BUDGETS",
      "title": "平均电流能供够，不等于每次位判决都建立",
      "paragraphs": [
        "AD7980 Rev. G的Table 3给出1 MSPS、REF=5 V时330 μA典型参考负载电流，不是最大保证值。p.18要求低阻抗驱动；未缓冲参考的具体例子使用22 μF，不能把本页模型里的10 μF当作统一BOM。p.25要求REF到GND的储能回路短而低阻。",
        "原创预算：假定把半个理想16位LSB全部分配给参考直流下陷，则5 V/131072≈38.147 μV；330 μA对应的总静态电阻预算约0.1156 Ω。它只是初筛，实际应给噪声、漂移、其他误差留份额，而且频率相关输出阻抗不能用一只直流电阻替代。"
      ],
      "formula": "半LSB参考预算 = 5 / 2¹⁷ ≈ 38.147 μV\nR预算 = 38.147 μV / 330 μA ≈ 0.1156 Ω\n假想每转换电荷 q = 330 μA / 1 MHz = 330 pC",
      "sourceIds": [
        "datasheet"
      ]
    },
    {
      "label": "04 / ORIGINAL CHARGE MODEL",
      "title": "增大电容减小单次跳变，却消不掉持续压降",
      "paragraphs": [
        "以下为本站原创离散模型，不是AD7980内部模型：理想5 V源经固定R补给C，每隔T抽取固定电荷q，抽取瞬间电压下降q/C；随后按RC指数恢复。xₙ定义为第n次抽取刚结束的正向下陷，初始完全恢复。所有抽取被集中到一个瞬间，真实逐位电流、码相关性、ESR/ESL、噪声和环路振铃都不在模型里。",
        "取T=1 μs、q=330 pC、R=1 Ω、C=10 μF：首点下陷33 μV，看似在38.147 μV内；第16点已约276.762 μV，稳态峰值约346.775 μV。只看首点会误判通过。",
        "仅把C改为22 μF：首点降为15 μV，但稳态峰值仍约337.557 μV。增大电容延后问题，不会消掉平均下陷R·q/T=330 μV。把R假想降至0.02 Ω且C=10 μF，模型峰值约33.224 μV，才在该单项预算内；这不是某款运放的稳定性证明。"
      ],
      "formula": "a = exp(−T/RC)；x₁ = q/C\nxₙ₊₁ = a·xₙ + q/C\nxₙ = (q/C)·(1−aⁿ)/(1−a)\nx∞ = (q/C)/(1−a)；整周期平均下陷 = R·q/T"
    },
    {
      "label": "05 / DIAGNOSIS, NOT A PATCH",
      "title": "丢几个点、平均或标定，分别能掩盖什么",
      "paragraphs": [
        "原创诊断建议：把每个突发的第1、2、4、8、16点和稳态段分组比较均值与离散度；再改变突发长度、间隔与速率。若只在连续稳态下拟合增益，配置改变后的参考负载可能使旧系数失效。不能看到斜坡就认定参考故障，还需排除输入驱动、热漂、数字读帧和电源耦合。",
        "在本模型中，初始点反而比末尾点接近理想参考；丢首点不能修复持续电阻压降，平均也不消除同向偏差。真实台架可能振铃，不能照搬模型算出的固定丢点数。示波器探头对REF增加的电容和地线电感必须计入；DMA完成时刻不等于参考位判决时刻。",
        "工程候选是适当的低阻参考/缓冲、贴近引脚的储能回路，以及有证据的容性负载稳定性。不是盲目加电容或串电阻；选件、输出摆幅、供电与过量程保护都须另行验证。"
      ],
      "sourceIds": [
        "drive"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下均尚未执行；仅限安全隔离低压台架。不得以网站模型通过代替真实电气额定值、稳定性或精度验收。"
      ],
      "bullets": [
        "冻结板卡与器件版本、参考/缓冲、电容实装有效值、走线、供电、输入幅度、CNV节拍和原始未校正码；检查输入、参考、数字电平各自额定值，改接线前断电。",
        "固定安全输入，分别记录连续及不同长度、间隔的突发；按突发内位置统计均值与标准差，独立保存时间序列。低、中、靠近满量程但留有余量的工作点分别验收。",
        "在已核对测量带宽与探头负载的条件下，观察REF局部节点和转换控制；对比接探头前后的码分布。更换参考或电容时一次只改一个变量，并核验容性负载稳定性。",
        "按应用先定义允许下陷、码偏移、恢复时间、有效首点和最坏温度/速率条件；对比模型预测与实测差异，保留失败数据。未达标时报告限制，不用滤波图或一次标定掩盖。"
      ]
    },
    {
      "label": "07 / TRANSFER AND CHECK",
      "title": "迁移练习：同样的平均速率，不一定同样的误差",
      "paragraphs": [
        "练习一：把模型改为100 kSPS连续采集，或保持1 MSPS突发但只占10%时间。两者长期平均转换数相同，突发内部的T却不同；计算各自的最大下陷，不允许只用平均吞吐量验收。练习二：三路ADC共用参考时，把同时抽取改为错开抽取，比较峰值与平均下陷；这只是共享节点电荷模型，不是新增STM32定时器路由。",
        "边界：参考扰动在真实SAR位判决中可能产生非线性错误，不能直接把xₙ按比例换成一条保证准确的ADC误差曲线。该模型既不生成“厂商实测码”，也不预测INL/DNL或放大器相位裕量。",
        "许可：本站原创文字、公式与测试；官方资料版权归ADI，公开阅读不等于软件开源授权。未复制图表、未下载运行候选程序、未接硬件。案例保持待学习，阅读或测试不自动改动已有六章学习状态。"
      ]
    }
  ]
});
window.SensorCaseOverviews["adi-sar-reference-burst"] = {
  "problem": "参考直流读数正确，采样突发中仍可能因补给电荷不足而逐点偏移。",
  "method": "对照厂商突发台架，分开平均电流与瞬态驱动，再用独立电荷模型检查首点和稳态。",
  "boundary": "厂商AD7686台架与AD7980量级计算分开；单极模型不含逐位电流与振铃，未本站实物复现。",
  "takeaway": "参考不仅要电压准，还要在每次位判决需要时提供稳定的标尺。"
};

// Original mixed-rate burst case; all twelve prior cases retained unchanged.
window.SensorCases.push({
  "id": "ti-f280015x-burst-sample-age",
  "maker": "TI",
  "title": "一次触发读三路，为什么五个读数不是同一时刻？",
  "subtitle": "F2800157 · ADC burst / SOC 轮询 / 快慢通道 / 样本年龄",
  "question": "两路要频繁更新，另外三路可以慢一些，怎样分配一次触发的三个转换名额？",
  "summary": "用固定转换槽分配快慢通道，同时给每个值保存自己的采样时间与有效性。",
  "published": "2026-10-01",
  "publicationLabel": "所读版本发布",
  "timingRelated": true,
  "revision": "C2000Ware 26.02.00.00.LTS · commit 699b8c6aa190cf7430a36bdcf7f5b1ea2e928063；SPRUIY4B / SPRSP68D",
  "verified": "2026-10-27",
  "evidence": "厂商成熟外设文档与官方示例 + 本站原创调度算术；没有本站台架结果",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "error",
    "debug"
  ],
  "conditions": "版本：官方示例固定到 C2000Ware 26.02.00.00.LTS 的 2026-10-01 提交，并非该方法首次发表。SysConfig 指定 TMS320F2800157、80PN；单 ADCA、12 位单端、ADCCLK 分频 2、SOC7–15、每槽 9 SYSCLK 获取窗口、末转换中断。TRM SPRUIY4B（2024-05）和数据手册 SPRSP68D（2025-11）用于交叉核对。仅阅读源文件，未生成、编译、执行或烧录示例；不能当作直接接线配置。",
  "sources": [
    {
      "id": "example",
      "label": "TI 官方示例 · 三转换轮询与 ISR",
      "url": "https://github.com/TexasInstruments/c2000ware-core-sdk/blob/699b8c6aa190cf7430a36bdcf7f5b1ea2e928063/driverlib/f280015x/examples/adc/adc_ex11_burst_mode_epwm.c",
      "date": "所读源码版本提交 2026-10-01；核验 2026-10-27；不以版权年份推定首发。"
    },
    {
      "id": "syscfg",
      "label": "同版本 SysConfig · F2800157 / 80PN / SOC7–15",
      "url": "https://github.com/TexasInstruments/c2000ware-core-sdk/blob/699b8c6aa190cf7430a36bdcf7f5b1ea2e928063/driverlib/f280015x/examples/adc/adc_ex11_burst_mode_epwm.syscfg",
      "date": "所读源码版本提交 2026-10-01；核验 2026-10-27；不以版权年份推定首发。"
    },
    {
      "id": "driver",
      "label": "同版本 DriverLib · 参数到寄存器的换算",
      "url": "https://github.com/TexasInstruments/c2000ware-core-sdk/blob/699b8c6aa190cf7430a36bdcf7f5b1ea2e928063/driverlib/f280015x/driverlib/adc.h",
      "date": "所读源码版本提交 2026-10-01；核验 2026-10-27；不以版权年份推定首发。"
    },
    {
      "id": "template",
      "label": "同版本 SysConfig 生成模板 · burstSize + 1",
      "url": "https://github.com/TexasInstruments/c2000ware-core-sdk/blob/699b8c6aa190cf7430a36bdcf7f5b1ea2e928063/driverlib/.meta/adc/adc.board.c.xdt",
      "date": "所读源码版本提交 2026-10-01；核验 2026-10-27；不以版权年份推定首发。"
    },
    {
      "id": "clock",
      "label": "同版本 device.h · 默认时钟条件",
      "url": "https://github.com/TexasInstruments/c2000ware-core-sdk/blob/699b8c6aa190cf7430a36bdcf7f5b1ea2e928063/device_support/f280015x/common/include/device.h",
      "date": "所读源码版本提交 2026-10-01；核验 2026-10-27；不以版权年份推定首发。"
    },
    {
      "id": "trm",
      "label": "TI SPRUIY4B · §§12.5、12.6、12.12 / Table 12-10",
      "url": "https://www.ti.com/lit/ug/spruiy4b/spruiy4b.pdf",
      "date": "原始 2023-02；Rev. B 2024-05；核验 2026-10-27。"
    },
    {
      "id": "ds",
      "label": "TI SPRSP68D · ADC 时序 Tables 6-24、6-25",
      "url": "https://www.ti.com/lit/ds/symlink/tms320f2800157.pdf",
      "date": "原始 2023-01；Rev. D 2025-11；核验 2026-10-27。"
    }
  ],
  "blocks": [
    {
      "label": "01 / THREE SLOTS, FIVE SIGNALS",
      "title": "快通道每次读，慢通道轮流读",
      "paragraphs": [
        "官方例子的三个 burst 分别使用 SOC7/8/9、SOC10/11/12、SOC13/14/15。前两槽都接 A0/A1，第三槽依次接 A2、A3、A4；结果存在各自 SOC 对应的结果寄存器。这里是单 ADC 顺序三转换，不是三 ADC 同时采样，也不是三个从定时器各自产生错相触发。",
        "本站解读：SOC 是转换任务槽，不等于一个永久独占的物理通道。重复安排 A0/A1，是用更多转换机会换取更高更新率；不需要每次中断改通道表。慢通道的旧值仍在内存，不代表这次又测了一遍。"
      ],
      "sourceIds": [
        "example",
        "syscfg"
      ]
    },
    {
      "label": "02 / CHECK THE THREE LEVELS",
      "title": "配置里的 2，为什么最终是三次转换？",
      "paragraphs": [
        "本版本 SysConfig 的 burstSize=2；已核生成模板将它加 1 传给 DriverLib；ADC_setBurstModeConfig 的参数是转换次数，再减 1 写 BURSTSIZE。因此硬件字段 2 对应三次转换，不能把配置值 2 直接抄成 API 参数 2。9 周期获取窗口传给 ADC_setupSOC 后写成 ACQPS=8。",
        "触发链是 ePWM1 向上计数命中 CMPA→SOCA→ADCA burst。示例 TBPRD=1999、CMPA=1000、事件分频为 1；SOCPRIORITY 使 SOC0–6 为高优先级、7–15 为轮询。轮询槽的单独 TRIGSEL 被 burst 触发源覆盖；这是 C2000 内部路由，不使用 STM32 ITR/TRGO 表。",
        "RRPOINTER 指向最近完成的轮询 SOC；示例 ISR 根据 9、12、15 判断哪组完成。它不是累计序号：若中断被长时间阻塞而轮询已绕回，相同指针不能证明中间没有丢帧。高优先级任务插入也会改变实际采样时刻。"
      ],
      "sourceIds": [
        "syscfg",
        "template",
        "driver",
        "trm",
        "example"
      ]
    },
    {
      "label": "03 / CLOCKS ARE NOT COMMENTS",
      "title": "先看真实时钟，再读“50 kHz”注释",
      "formula": "条件算例：TBCLK = 100 MHz，向上计数 0…1999\nTburst = (1999+1)/100 MHz = 20 μs\nf(A0)=f(A1)=50 kSPS；f(A2)=f(A3)=f(A4)=50/3 ≈ 16.667 kSPS\n每秒总转换数 = 3 × 50,000 = 150,000",
      "paragraphs": [
        "50 kHz 只是源码注释在 100 MHz ePWM 时钟下的条件计算。同版本 device.h 的默认 SYSCLK 公式为 120 MHz；不能据注释就认定实际工程是 100 MHz。若实际 TBCLK=120 MHz 且其余参数不变，burst 是 60 kHz、慢通道各 20 kSPS。需核真实时钟树与板卡构建宏。",
        "CNT/TBCTR 初值影响第一次何时命中；CMPA 决定本周期事件位置；TBPRD 决定稳态周期。它们不能互相替代。本文只分析固定参数，不给动态预装载提交或多模块同步配置；若后续加入同步、影子装载或相位重置，必须重新核验首次帧与稳态时序。"
      ],
      "sourceIds": [
        "example",
        "clock"
      ]
    },
    {
      "label": "04 / FINISH BEFORE THE NEXT BURST",
      "title": "获取、转换、结果锁存是三个预算",
      "formula": "相对第一槽开始获取，假设无其他 SOC 插入：\nSYSCLK = 100 MHz，ADCCLK = 50 MHz，获取窗口 = 9 周期 = 90 ns\ntEOC=21 周期；tLAT=23 周期（分频 2）\n三槽最后结果锁存 = [2×(9+21)+9+23]/100 MHz = 0.92 μs\n首末获取终点相差 = 2×(9+21)/100 MHz = 0.60 μs",
      "paragraphs": [
        "这些是文档参数的独立算术，不含外部触发到第一槽的延迟、ISR、总线等待或竞争，不能当作完整处理延迟。tEOC 是允许下一槽开始的间隔；tLAT 是结果寄存器真正更新的间隔，二者不能混用。每个 burst 必须在下次触发前完成，不能仅拿 150 kSPS 平均速率与 ADC 标称峰值比较。",
        "9 周期是示例设置，不是任意源阻抗都适用的模拟建立保证。外部模拟开关切换、驱动恢复与采样电容建立要另外预算；没有核验隔离条件，不能擅自假定它们与转换完全重叠。本例由 ISR 读固定结果寄存器，没有 DMA 请求或 DMA 排列可供照搬。"
      ],
      "sourceIds": [
        "trm",
        "ds",
        "syscfg"
      ]
    },
    {
      "label": "05 / THE AGE OF A VALUE",
      "title": "软件凑齐五个数，不会让它们同时变新",
      "formula": "合成时间轴：触发在 0、20、40 μs，暂忽略槽内亚微秒偏移\n第三次完成时：A0/A1/A4 来自 40 μs；A3 来自 20 μs；A2 来自 0 μs\nA2/A3/A4 的更新间隔均为 60 μs，而非 20 μs",
      "paragraphs": [
        "本站建议的帧合同：每路值携带通道 ID、实际采样时刻或可验证的时刻估计、burst 序号与有效标志。快通道可用于快速闭环，慢通道可用于较慢诊断，但应用要显式接受它们的年龄。三组慢通道全部刷新一次，并不意味着得到五路同一瞬间快照。",
        "若任务要求五路都不超过 30 μs 的年龄，第三次 burst 后 A2 约 40 μs 已失败，即使所有数组元素都非零。若控制算法将五路当作同步向量，需要改采样方案或建立时间对齐模型；简单复制旧值和插值都不能伪装成新实测。",
        "故障判定要记录溢出与序号缺口；只清 ADC 中断溢出标志不等于恢复所有历史样本。本文不承诺 ISR 示例在任意业务负载下无丢样。"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。仅在确认安全隔离的低压台架，按准确芯片封装和板卡原理图核对 ADC 引脚范围与共地；不据本文接线。"
      ],
      "bullets": [
        "冻结芯片/板卡修订、时钟树、SysConfig 与生成文件版本、输入源阻抗、参考、SOC 表；确认获取窗口满足电气要求。",
        "先用五个可区分的安全 DC 电平验证通道身份，再用已知斜坡观察槽内先后；不要用同电平输入掩盖错位。",
        "用调试事件与捕获时间测量实际 burst 周期、处理截止时间和样本年龄；加业务负载，统计中断溢出、序号缺口和丢弃帧。",
        "测试启动、停止再启动及异常恢复。重新确认 RR 指针/槽组与首帧有效边界，验证从未更新过的通道不会被当成有效测量。"
      ]
    },
    {
      "label": "07 / WHAT TRANSFERS",
      "title": "带走的是采样资源分配，不是现成固件",
      "paragraphs": [
        "练习一：保持总 burst 50 kHz，把每三次触发轮换的慢通道改成四路，其他合同不变。每路慢信号变为 12.5 kSPS，轮询周期 80 μs；请解释为什么增加诊断通道会影响最坏数据年龄。练习二：SYSCLK/TBCLK 都改为 120 MHz，保留寄存器值，独立算出 16.667 μs 触发周期、0.7667 μs 三槽锁存区间与 0.5 μs 首末获取终点差。",
        "适合快慢混合输入且允许单 ADC 顺序采样的系统；不适合无条件要求三相真正同时的测量。迁移到 GD32/STM32 时不能照抄 SOC 轮询寄存器，而应核它们的扫描序列、定时器触发、转换抢占与 DMA 数据身份。",
        "证据：官方维护的示例和器件文档证明机制有明确实现，不证明本站运行或量产性能。源码文件头为 BSD-3-Clause 式三条款许可，具体复用须保留相应声明；TI 文档版权单独适用。本站只原创解释与算术、链接原文，不复制厂商图表或执行候选代码；新案例保持待学习。"
      ],
      "sourceIds": [
        "example",
        "trm"
      ]
    }
  ]
});
window.SensorCaseOverviews["ti-f280015x-burst-sample-age"] = {
  "problem": "想让两路信号每次都更新，另外三路轮流读，却容易把内存里五个数误当成同一帧新测量。",
  "method": "给单 ADC 的转换槽分配不同重复频率，再用槽组、时间戳和序号管理每一路样本的年龄。",
  "boundary": "依据固定版本官方示例和手册；只有独立调度算术，没有本站实物复现或直接可用的固件。",
  "takeaway": "一次触发三次转换，不等于三路同时；五路值都存在，也不等于五路刚刚更新。"
};

// Original SAADC buffer-deadline case; all thirteen prior cases retained unchanged.
window.SensorCases.push({
  "id": "nordic-saadc-buffer-deadline",
  "maker": "Nordic",
  "title": "硬件自动换缓冲，为什么仍会丢掉一整块？",
  "subtitle": "nRF52840 · TIMER / PPI / SAADC / EasyDMA · 两种截止时间",
  "question": "定时器触发和缓冲切换都不经过 CPU，是否就不用再管处理任务有多慢？",
  "summary": "分清采样触发、下一块启动和旧块归还；用三路顺序扫描检验通道顺序与缓冲所有权。",
  "published": "2026-04-21",
  "publicationLabel": "所读教程发布",
  "revision": "Nordic Academy NCS v3.2.0 教程（2026-04-21）；nRF52840 PS v1.8（2023-12-01）；源码参照 7f99e9d（2026-08-11）",
  "verified": "2026-10-28",
  "evidence": "厂商教程和产品规格 + 本站原创帧与缓冲期限算术；不是厂商整机性能报告",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "timingRelated": true,
  "lessons": [
    "adc",
    "debug",
    "error"
  ],
  "conditions": "限定 nRF52840 的 PPI/SAADC/EasyDMA，版本按来源冻结。官方教程演示单通道 AIN0、12 bit、50 μs 周期、两块各8000个int16结果；本文三通道96结果是另行推演，不是官方工程原配置。未编译、执行或烧录候选固件；未核定具体板卡引脚与硅版本勘误，不能直接作为接线或量产配置。",
  "sources": [
    {
      "id": "tutorial",
      "label": "Nordic Academy · Lesson 6 Exercise 3 · NCS v3.2.0",
      "url": "https://academy.nordicsemi.com/?nds_version_content=nrf-connect-sdk-intermediate-lesson-6-exercise-3-interfacing-with-adc-using-nrfx-drivers-and-timer-ppi-v3-2-0",
      "date": "页面标注 2026-04-21；核验2026-10-28，不当作技术首次发明日期。"
    },
    {
      "id": "ps",
      "label": "nRF52840 PS v1.8 · §§6.23、6.23.4、6.23.5、6.23.10",
      "url": "https://devzone.nordicsemi.com/cfs-file/__key/communityserver-discussions-components-files/4/nRF52840_5F00_PS_5F00_v1.8.pdf",
      "date": "封面2023-12-01，4413_417 v1.8；官方社区所载厂商原PDF，非声称最新版；核验2026-10-28。"
    },
    {
      "id": "code",
      "label": "Nordic Academy 解答源码 · 固定提交 / 文件头许可",
      "url": "https://github.com/NordicDeveloperAcademy/ncs-inter/blob/7f99e9d5858087e452df443586262727da4c4b04/l6/l6_e3_sol/src/main.c",
      "date": "该文件版本提交2026-08-11；核验2026-10-28，和v3.2.0教程分开标版本。"
    }
  ],
  "blocks": [
    {
      "label": "01 / TWO HARDWARE LINKS",
      "title": "采样准时，与下一块准时启动，是两条链",
      "paragraphs": [
        "教程用 TIMER2 的 COMPARE0 事件触发 SAADC SAMPLE；计数时钟1 MHz，比较点50，COMPARE0→CLEAR短接形成50 μs周期。另一条 PPI 把 SAADC END 接到 START，以免等中断服务才开始下一缓冲。nRF52840 用PPI，不是其他系列的DPPI，也不涉及STM32 ITR/TRGO映射。",
        "START负责准备结果缓冲，SAMPLE才开始采样；教程在READY后启动定时器。把START当成每个样本的触发，或者在缓冲就绪前放行定时器，都会混淆第一帧。本文不提供运行中修改比较值或预装载配置，改频率应另验首帧与稳态。"
      ],
      "sourceIds": [
        "tutorial",
        "code"
      ]
    },
    {
      "label": "02 / SCAN IS NOT SIMULTANEOUS",
      "title": "一拍三路，是三次顺序转换",
      "paragraphs": [
        "PS规定一次SAMPLE遍历已使能通道，按逻辑通道编号从小到大顺序采样；它不是三个同时工作的ADC。RESULT.PTR指向RAM，16 bit结果按通道序列写入。内部采样定时器只支持单通道；三路扫描使用外部TIMER/PPI。",
        "合成约定：使能逻辑CH1、CH2、CH5，它们拟映射到三路模拟输入，实际映射须另行核验。线性缓冲依次为CH1[0]、CH2[0]、CH5[0]、CH1[1]……。逻辑CH编号不等于AIN引脚编号；具体PSELP及板级引脚尚待配置核验。为本例完整帧交付，选择96个结果=32帧，而不是把官方单路8000结果直接搬来称作三路整帧。"
      ],
      "sourceIds": [
        "ps"
      ]
    },
    {
      "label": "03 / ONE FRAME BUDGET",
      "title": "总平均速率够，还要每拍来得及",
      "formula": "合成预算：T = 50 μs，三路各 tACQ = 10 μs，假设每次 tCONV = 2 μs\n单帧转换预算 = 3 × (10+2) = 36 μs\n相对第一路获取开始，三路获取终点 = 10、22、34 μs\n三路各20 kSPS，总结果速率60 kwords/s；首末采样终点差24 μs",
      "paragraphs": [
        "2 μs是本例为便于计算选取的转换预算；PS电气表在典型栏写小于2 μs，不能把此算例当作所有条件下的最大转换保证。还需加触发传播、总线和实测裕量。剩下14 μs不是整个软件处理预算，更不是零抖动承诺。",
        "PS的10 μs获取时间对应源阻抗不超过100 kΩ的表列条件；外部模拟开关、运放恢复和额外RC仍需独立验算。公式只检查时间表，不证明模拟电压已经准确建立；这里没有模拟开关控制链。"
      ],
      "sourceIds": [
        "ps"
      ]
    },
    {
      "label": "04 / DOUBLE BUFFER IS NOT INFINITE",
      "title": "PPI避免切换等待，不会替CPU处理旧块",
      "formula": "合成双缓冲：每块96个16 bit结果，三路每帧 → 32帧/块\n块间隔 = 32 × 50 μs = 1600 μs；双缓冲RAM = 2 × 96 × 2 = 384字节\n只用两块且不复制：旧块处理+排队+归还 必须 < 1600 μs − 安全裕量",
      "paragraphs": [
        "RESULT.PTR在START时锁存，STARTED后才可准备下一地址；END或STOPPED表示EasyDMA不再访问刚结束的缓冲，可读AMOUNT核实际数量。BUF_REQ表示需要提供后续缓冲，DONE表示已有一块结果完成，两个事件不能混当“这块随便覆盖”。",
        "原创所有权合同：FREE→DMA_ACTIVE→READY→PROCESSING→FREE。只有FREE块能再次交给DMA。若处理耗时1.8 ms而下一块1.6 ms就满，两块方案已经不够；提前把仍在读取的A块重新排队，会让分析端看到新旧数据混合。硬件切换速度再快也不能补救该竞争。",
        "可增加受控队列、复制后再处理或降低数据率，但必须显式规定队列满时停采/丢块策略和序号。本文不推断驱动缺缓冲时自动保证无损；不应假设DONE回调的到达时刻就是首样本采样时刻。"
      ],
      "sourceIds": [
        "ps",
        "tutorial"
      ]
    },
    {
      "label": "05 / A FRAME NEEDS AN IDENTITY",
      "title": "缓冲长度正确，不等于样本时间正确",
      "paragraphs": [
        "每块建议携带首帧序号、使能通道表、有效结果数、触发周期和配置版本；只在可验证的无丢触发前提下，由首帧时刻推算后续时刻。一次忙时触发、停止恢复或参数改变都会破坏“数组索引=绝对时间”的假设。",
        "合成检查：96个结果可拆32完整三路帧；95个结果只含31完整帧加2个值，不能强行补零为32个有效帧。消费端遇不完整帧应隔离/标缺测。把两块样本直接连起来做FFT，还要验证边界没有间隙，不是只检查数组长度。"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。仅在安全隔离低压台架，先核板卡原理图、输入范围、供电及共地；本文不是接线指南。"
      ],
      "bullets": [
        "记录nRF52840具体封装/硅版本、PS与勘误、SDK/nrfx版本、TIMER/PPI资源占用和输入源阻抗，复核实际事件地址。",
        "先用三路不同安全DC电平验证逻辑通道顺序，再用斜坡验证顺序采样的时间偏移；不要用三个相同电平掩盖错位。",
        "注入处理延迟和业务中断负载，统计块序号、AMOUNT、队列深度及丢块；验证PROCESSING块绝不被重新交给DMA。",
        "测试首次启动、停采重启、缺缓冲和改采样率后的首块有效边界；对比跨块连续信号而不是只看平均值。"
      ]
    },
    {
      "label": "07 / WHAT TRANSFERS",
      "title": "迁移所有权模型，不照搬外设名",
      "paragraphs": [
        "练习：块长改为192个结果，三路50 μs周期不变。答案为64帧、3.2 ms块间隔、双块768字节；处理期限变宽，但首次整块交付也更晚。若只增通道数而不增块长，则可用帧数和块时间反而缩短。",
        "适合低中速扫描、连续波形或批量传感采集。需要真正同时采样时应另选硬件；迁移到GD32/STM32要重新核DMA双缓冲/循环模式及触发路由，不能把PPI概念直接写成现成寄存器配置。",
        "成熟度证据是厂商产品规格与公开教学实现，而非本站实物复现。教程及PS有各自版权；所读源码文件头是LicenseRef-Nordic-5-Clause，不是MIT或Apache通用许可，复用需阅读其条款。本页不复制厂商图表或代码，不执行候选工程；仅原创解释和模型，新案例保持待学习。"
      ],
      "sourceIds": [
        "tutorial",
        "ps",
        "code"
      ]
    }
  ]
});
window.SensorCaseOverviews["nordic-saadc-buffer-deadline"] = {
  "problem": "自动触发和自动换缓冲都正常，分析端却可能读到被DMA覆盖的旧块，三路值也容易被误当同时采样。",
  "method": "把TIMER→SAMPLE和END→START分开验收，再用明确的缓冲所有权、通道顺序与块期限管理交付。",
  "boundary": "nRF52840厂商文档与教程机制；三路96结果为原创推演，未做实物复现，不是可直接烧录配置。",
  "takeaway": "硬件准时不等于软件无限慢；块号、样本数与所有权一起决定数据是否可信。"
};

// Original reconfiguration/synchronization case; all fourteen prior cases retained unchanged.
window.SensorCases.push({
  "id": "adi-ade-reconfiguration-sync",
  "maker": "ADI",
  "title": "共用时钟，改完配置为什么又不同步？",
  "subtitle": "AN-2625 · 多 ADC / 配置代际 / 同步验收",
  "question": "几颗 ADC 的时钟没有变，为什么改一次滤波设置后，相位比较就不可信了？",
  "summary": "把配置完成、计数器对齐、滤波建立和数据交付分成四道门，不用一个“同步成功”标志代替全部验收。",
  "published": "2025-09",
  "revision": "AN-2625 Rev. 0；ADEMA124/127 Rev. A（2025-11）；ADE91xx Rev. A（2025-04）",
  "verified": "2026-10-29",
  "evidence": "厂商应用说明与数据手册 + 原创协议 / 时间预算",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "error",
    "debug"
  ],
  "timingRelated": true,
  "conditions": "版本范围：AN-2625 的三颗 ADEMA127 加一颗 ADE9113 菊链示例；共同 MCLK 16.384 MHz，长 SPI 帧。本文阅读硬件文档，不绑定或执行 energy-adc-service 版本；没有板卡实测，也不提供接线、寄存器脚本或可烧录固件。",
  "sources": [
    {
      "id": "note",
      "label": "ADI AN-2625 · 同步、DREADY 与菊链吞吐章节 / Tables 1–2",
      "url": "https://www.analog.com/en/resources/app-notes/an-2625.html",
      "date": "AN-2625 Rev. 0 · 2025-09；核验 2026-10-29，网页与原 PDF（印刷 p.2）的版本日期已核对。"
    },
    {
      "id": "ma",
      "label": "ADEMA124/ADEMA127 Rev. A · pp.35、39–40 / 配置锁与 DSP RAM",
      "url": "https://www.analog.com/media/en/technical-documentation/data-sheets/adema124-127.pdf",
      "date": "初版 2025-07；Rev. A 2025-11（p.2 修订记录）；核验 2026-10-29。"
    },
    {
      "id": "91",
      "label": "ADE9103/ADE9112/ADE9113 Rev. A · pp.42–43 / ALIGN 与 SNAPSHOT",
      "url": "https://www.analog.com/media/en/technical-documentation/data-sheets/ade9103-ade9112-ade9113.pdf",
      "date": "Rev. A 2025-04（p.2 修订记录）；核验 2026-10-29。"
    }
  ],
  "blocks": [
    {
      "label": "01 / SAME CLOCK IS NOT A LIFETIME CONTRACT",
      "title": "时钟一直在走，转换却可能停过一次",
      "paragraphs": [
        "AN-2625 的约束：同步需要共同 MCLK 和相同输出率；含 ADEMA12x 的链中，DATAPATH_CONFIG_LOCK 的切换会停 / 重启转换，可能丢失原来的对齐。厂商推荐改后重新同步。全链均为 ADEMA12x 时同步解锁 / 加锁的替代办法，不能搬到混合链。",
        "本站分析：把“共用振荡器”看成大家走得一样快，把“对齐”看成大家从同一个刻度开始。某一颗中途暂停再走，前一个条件仍成立，后一个条件却未必成立。这个问题不同于随机采样抖动，也不是 DMA 排队延迟；先把新旧配置分段，再判断样本能否一起比较。"
      ],
      "sourceIds": [
        "note"
      ]
    },
    {
      "label": "02 / CONFIGURATION HAS A COMPLETION EVENT",
      "title": "大约 40 μs，不是固定等待后就可以开工",
      "paragraphs": [
        "ADEMA Rev. A pp.35、39–40：重新加锁后，等待 DREADY 拉低确认重启及 ROM→DSP RAM 写入完成，约 40 μs；此前不要做 SPI 交易。启用有关 DSP 功能时，加锁会覆盖 DSP RAM 系数。自定义系数必须按手册在其后取得内存访问、等待 READY 再写入并释放。波形样本有效不等于滤波器已经建立。",
        "这里的 DREADY 必须能归属到正在配置的 ADEMA，才是它的完成证据；不能拿链末端另一颗 ADE9113 仍在跳动的 DREADY，证明所有 ADEMA 已完成 ROM 装载。AN-2625 的单根 DREADY 代表全链以前提同步已经成立；具体板卡如何取得各配置完成事件，必须另行验证。",
        "原创设计建议：每次修改增加 config_epoch，并立即撤销输出有效资格。先完成器件规定的配置事务，再完成同步与建立验收；任何超时、状态缺失或系数核对失败都留在无效状态。不要把上一次成功留下的布尔变量沿用到新配置，也不要为取得 READY 而在手册禁止 SPI 的阶段反复读寄存器。",
        "例如自定义低通系数已写好，随后又改通道设置并重新加锁，就可能重新加载默认系数。CPU 内存中的“已配置”并不能证明芯片当前采用哪组系数；应记录期望配置、完成事件和允许时机的读回证据。这里是验收思路，不是完整驱动状态机。"
      ],
      "sourceIds": [
        "note",
        "ma"
      ]
    },
    {
      "label": "03 / ALIGN IS A CHANGE, SNAPSHOT IS A CHECK",
      "title": "别用不停重同步，掩盖还没验明的原因",
      "formula": "文档周期换算：8 kSPS → 125 μs / 输出周期\nADE91xx ALIGN 的 3 个 DREADY 周期 → 375 μs\n共同 MCLK 16.384 MHz → 1 个计数约 61.035 ns",
      "paragraphs": [
        "ADE91xx Rev. A p.43 要求 ALIGN 后等 3 个 DREADY 周期；运行中对齐可影响最多三个样本，不建议短时间持续重对齐。ALIGN 锁存的是对齐动作前的计数，之后应另做 SNAPSHOT 检查。计数差 ±1 是该同步检查口径，不是整个模拟信号链的相位精度。",
        "原创验收合同：先隔离恢复区间，等规定周期，再拿同一次 SNAPSHOT 的各设备结果比较；不合格则保持数据无效并诊断，不直接自动放行。375 μs 只是上述等待的周期换算，不含配置、SPI、调度或额外滤波建立，所以不是总恢复延迟。",
        "即使计数器对齐，不同数字滤波器、模拟前端和传感器也可能有不同延迟。还要用共同的安全低压测试信号检查通道传递函数；不能据同步计数通过，直接宣称电压 / 电流或不同传感器的物理相位已校准。"
      ],
      "sourceIds": [
        "91",
        "ma"
      ]
    },
    {
      "label": "04 / RATE IS AN INTERSECTION",
      "title": "总线传得动的速率，不一定是器件支持的档位",
      "formula": "AN-2625 示例参数的本站复算：3 × 256 + 128 = 896 bit / 链帧\n20 MHz SPI：896 / 20 MHz = 44.8 μs\n另计 5 μs + 10 ns + 10 ns → 49.82 μs / 交易预算\n1 / 49.82 μs ≈ 20.072 k 次 / s；混合链选 8 kSPS，不是 16 kSPS\n8 kSPS 周期的余量：125 − 49.82 = 75.18 μs",
      "paragraphs": [
        "源中 ADEMA127 / ADE9113 长帧分别为 256 / 128 bit。16.384 MHz 下两系列共同输出档位为 32、8、4、2、1 kSPS；ADE9113 没有 16 kSPS 档。因此该示例总线预算不容许 32 kSPS，下一共同档位是 8 kSPS。数值是文档例子的算术复核，不是实测吞吐。",
        "原创反例：若每拍另外存在不可重叠的 80 μs 调度 / 服务开销，总计 129.82 μs，已超过 125 μs。75.18 μs 不能整块留给算法而不管中断抖动、隔离器传播和其他总线工作。帧能按时读完，仍不证明其配置代际、通道顺序和物理时刻正确。",
        "把速率选择写成三项交集：每个器件实际支持的档位、链路最坏服务期限、应用所需带宽。这里没有提供 SPI 引脚、DMA 请求或定时器映射；换 MCU 或隔离器，必须重做实际时序与信号完整性验证。"
      ],
      "sourceIds": [
        "note"
      ]
    },
    {
      "label": "05 / DATA CARRIES ITS EPOCH",
      "title": "一条旧缓冲，不能搭新配置的便车",
      "paragraphs": [
        "本站原创数据合同：每个交付块携带 config_epoch、sync_epoch、首样本序号、设备列表和 valid。仅在配置完成、所需系数处理完成、同步等待结束、事后快照合格、建立期已确认且所有设备齐全时发布。每个 epoch 只描述本应用的分段，不冒充芯片寄存器。",
        "合成例：旧块标 config=7 / sync=3；开始重配置后目标变为 config=8。即使旧块晚到、CRC 正确且长度完整，也不能把标签改成 8 后接上新数据。缺一个设备、重复设备或混入旧同步代际，都应保留为缺测 / 无效，而不是补零装成正常帧。",
        "对于 FFT、RMS 或通道相位计算，窗口不得无提示跨越重配置和对齐产生的间隙。舍弃整窗、分段分析或采用明确的缺测模型都是应用决策；不能删掉无效点后继续假定原始时间间隔不变。"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。只使用安全隔离的低压信号源；这不是市电测量接线指南。芯片隔离能力不等于整机、探头或操作方式安全。"
      ],
      "bullets": [
        "冻结器件 / 硅版本、文档版本、完整滤波与时钟配置、主机版本和 SPI 链顺序；先用各路不同低压 DC 值确认字段与设备身份。",
        "用共同低压波形对照改配置前后；保存 DREADY、CS、配置完成事件、事后 SNAPSHOT 和原始码，分别检查数字对齐与模拟相位。",
        "在真实允许操作时序内测试延迟、缺设备、状态超时、旧块迟到及失败恢复；确认所有失败都不会携旧 epoch 被标为有效，也不引起无限自动 ALIGN。",
        "记录首次有效样本和整窗交付时刻，覆盖不同滤波 / 采样率及代表性业务负载；验收阈值包含链路余量、建立期与应用误差预算。"
      ]
    },
    {
      "label": "07 / TRANSFER THE ACCEPTANCE CONTRACT",
      "title": "先写无效边界，再写漂亮曲线",
      "paragraphs": [
        "迁移练习：保持同一教学 SPI 参数，把链缩成一颗 ADEMA127 加一颗 ADE9113。链帧为 384 bit，交易预算为 24.22 μs；32 kSPS 的 31.25 μs 周期只剩 7.03 μs。共同档位允许，不代表加上真实开销仍能通过。",
        "反向练习：一个只有 ±1 计数偏差的快照，若来自旧配置或读数不是同一次抓取，能否宣布新链同步成功？不能。数值门限检查的是一次合格观测，不会替你证明观测的身份和前置步骤。",
        "适用思路是多器件采集的重配置验收，不是该型号的性能推荐。厂商文档与软件许可分别成立：本文只作原创解释、公式复算与合成协议测试，不复制厂商图表或代码。未编译、执行或烧录候选工程，未验证 energy-adc-service 的实现，也没有本站或独立第三方实物复现；新案例保持待学习。"
      ]
    }
  ]
});
window.SensorCaseOverviews["adi-ade-reconfiguration-sync"] = {
  "problem": "共用时钟的多颗 ADC 改完配置后，数据仍在输出，却可能失去对齐，旧缓冲也可能混入新一轮测量。",
  "method": "把配置完成、同步检查、滤波建立与交付资格分开，给数据标配置代际，失败区间明确无效。",
  "boundary": "厂商文档说明机制；时间预算和有效性合同为原创推演，尚未板测，不是完整驱动或市电接线方案。",
  "takeaway": "同一时钟、同一速率只是起点；每次重配置后，都要重新证明这批样本属于同一有效测量。"
};

// Original FIFO transaction case; all fifteen prior cases retained unchanged.
window.SensorCases.push({
  "id": "bosch-bmi270-fifo-transaction",
  "maker": "Bosch Sensortec",
  "title": "读满了字节，为什么 FIFO 里还是同一帧？",
  "subtitle": "BMI270 · 总线事务 / 半帧重放 / 时间锚点",
  "question": "一次只读走半帧，下一次该接着拼，还是从帧头重新认？",
  "summary": "把总线事务、完整帧出队和样本时间分开，避免一条长度正确却身份错误的数据流。",
  "published": "2019-05-17",
  "revision": "BST-BMI270-DS000-08 · Rev. 1.6 · 2026-03-06；本次修订仅更新免责声明",
  "verified": "2026-10-30",
  "evidence": "厂商数据手册机制 + 本站原创合成事务与预算测试；非厂商台架性能报告",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "error",
    "debug"
  ],
  "conditions": "限定 BMI270 标准配置、2048 字节 FIFO、header mode、无 AUX、加速度计与陀螺仪同 ODR 的稳态。示例选 200 Hz、无外部标签；每帧 1 字节头 + 6 字节陀螺仪 + 6 字节加速度。所读版本 Rev. 1.6；不采用另需配置的 6 KB MaxFIFO。该器件官方面向穿戴 / hearable，本文研究 MCU 接收协议，不宣称工业级资格、工业现场性能或可直接部署。",
  "sources": [
    {
      "id": "ds",
      "label": "Bosch BMI270 Rev. 1.6 · §§4.6.15、4.7 / pp.32–40、86–87、149",
      "url": "https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmi270-ds000.pdf",
      "date": "正式 Rev. 1.0 2019-05-17；Rev. 1.6 2026-03-06（文档历史）；核验 2026-10-30"
    },
    {
      "id": "product",
      "label": "Bosch BMI270 官方产品页 · 定位、文档与独立 Max FIFO 入口",
      "url": "https://www.bosch-sensortec.com/en/products/motion-sensors/imus/bmi270",
      "date": "页面未显示可确认的原始发布日期；核验 2026-10-30；不据当前页面推断初版性能"
    }
  ],
  "blocks": [
    {
      "label": "01 / A TRANSACTION IS NOT A BYTE PIPE",
      "title": "完整帧才出队，读过不等于删掉",
      "paragraphs": [
        "文档约束：FIFO_DATA 采用 burst 读取。完整帧读完才从设备 FIFO 删除；若在帧中间结束一次访问，下次访问重发整帧，header mode 连帧头一起重发。这里的“下次”是新总线事务，不是同一次连续 burst 内的 DMA 内存分段。",
        "本站判断：主机驱动至少要告诉上层“这批字节属于哪次访问、访问是否正常结束”。只给一条不断增长的 byte 数组，会丢失判断尾部残片能否接续的必要信息。SPI dummy 字节也应由传输层按接口合同剥离，不能当作帧头。",
        "帧长随传感器组合、控制帧和配置改变，不应在通用实现中每 13 字节切一刀。本文固定 13 字节只是为了隔离一个故障机制，不是通用 BMI270 解析器；也不提供 MCU 引脚、DMA 请求或中断映射。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "02 / A SMALL COUNTEREXAMPLE",
      "title": "20 字节加 26 字节，不是连续的 46 字节",
      "formula": "合成 FIFO：A(13) | B(13) | C(13)\n事务 1 读 20：A 全帧 + B 前 7 字节；设备仍保留 B、C\n事务 2 读 26：B 全帧 + C 全帧\n有效交付：A、B、C = 39 字节；线上传输包含 7 字节重放",
      "paragraphs": [
        "原创反例假设：两次访问均成功、期间没有新采样或溢出，不计 dummy 和尾部控制帧。若把第一次剩下的 B 前缀与第二次整帧 B 拼接，第二个“13 字节帧”会含两份 B 开头，后续 C 也错位。缓存长度变长，并不证明获得更多独立样本。",
        "在这个受限模型里，事务结束时只提交完整帧，舍弃未完成的主机尾片；新事务重新从设备返回的帧头解析。反过来，若只是同一连续 burst 被 DMA 分成 20 与 19 字节两块，必须保留第一块尾片再接第二块，才得到 A、B、C。处理方法由总线边界决定，不能由数组大小猜。",
        "若总线报错或完成字节数不可信，情况更严：设备可能已经删掉一个主机没收到的完整帧。此时“再读一次”不能保证无损恢复；应撤销这段连续性资格，按实际驱动和器件状态制定重新建立边界的方案。本文没有证明异常恢复已经可用。"
      ]
    },
    {
      "label": "03 / READOUT TIME IS NOT SAMPLE TIME",
      "title": "尾部时钟，是读出锚点，不是最新样本出生证",
      "formula": "39.0625 μs / tick；200 Hz → 5 ms → 128 tick / 理想周期\n24 位计数回绕：2²⁴ × 39.0625 μs = 655.36 s\n合成旧 / 新计数：0xFFFFF0 → 0x000030，模差 64 tick = 2.5 ms",
      "paragraphs": [
        "文档定义：启用 fifo_time_en 后，FIFO 在 burst 中读空时才发送尾部 sensortime；其值在最后一个样本帧的最后字节被读出时锁存。这不是该样本的采样时刻，也不是中断进入、DMA 完成或主机回调时间。FIFO_LENGTH 不含这个尾部时间帧，读够预先查询的长度未必拿到时间锚点。",
        "原创验收思路：分别记录 host 事务开始 / 结束、设备读出时钟、配置分段与连续性证据。要重建采样时刻，还需正确 ODR 网格、滤波延迟、主机与设备时钟关系及丢失情况；本页不把“末帧时间减若干周期”包装成已验证时间戳算法。",
        "上述模差仅在已知没有复位、并能约束跨越少于一个回绕周期时可解释为 2.5 ms。相同读数也可能对应多圈或设备重启；没有外部时间界限与会话身份，就不能靠一次取模宣布时间连续。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "04 / HEADROOM IS A DEADLINE",
      "title": "FIFO 是有限的喘息空间，不是无限慢的许可证",
      "formula": "教学假设：200 帧/s × 13 字节 = 2600 字节/s\n起点 80 帧 = 1040 字节；无读取再等 300 ms → 140 帧 = 1820 字节\n另从同一起点总共等 400 ms → 160 帧 = 2080 字节 > 2048 字节\n以上忽略控制帧、启动瞬态及预留空间；不是安全等待时间规格",
      "paragraphs": [
        "这个简单反例说明：平均 SPI 速度很快，也不能弥补任务连续几百毫秒没服务。真实截止期限应从水位、最大帧尺寸、最坏唤醒 / 总线占用与控制帧开销推导，留出余量；不能把 2048 / 2600 算出的名义时间当量产保证。标准 2 KB 与另一配置的 6 KB 不应混用。",
        "文档中的两种满缓冲策略决定是丢旧还是丢新；两次访问之间若发生溢出，之前半帧是否还保留也取决于 fifo_stop_on_full。读出期间若消耗速度追不上写入，即使选择覆盖旧数据，仍可能丢新数据并置 fifo_err。",
        "原创交付合同：出现 skip、fifo_err、未知访问结尾或模式变化时，显式生成缺测 / 重新同步边界。skip 计数饱和为 0xFF 后不能当作精确丢失数，更不能把后续点重新编号填满 FFT 窗口，假装等间隔原始序列从未中断。"
      ],
      "sourceIds": [
        "ds",
        "product"
      ]
    },
    {
      "label": "05 / KEEP THE FAILURE VISIBLE",
      "title": "解析通过，与分析窗口可用，是两次验收",
      "paragraphs": [
        "本站原创合成测试分三层：先验证 A/B/C 的完整性与不重复，再验证配置分段一致和访问是否确定，最后检查拟交付窗口是否连续。使用软件自建序号和 read_id 只是主机账本，不冒充器件已有的逐样本序号。",
        "可解析出 32 组数字，却经历过一次未知长度总线错误，仍应拒绝它作为无缝等间隔窗口。拒绝不等于把这批数据全删掉：保留原始事务、原因和状态，允许诊断工具查看；只是不要把它交给要求连续采样的算法。",
        "源文档还区分稳态与启停 / 变配置期间的帧组合。本文测试固定组合时不会触及全部控制帧、AUX、低功耗唤醒或真实溢出状态机；真实实现应分别验证这些功能，不将受限模型扩展成驱动正确性的证明。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。仅在已确认安全隔离的低压开发板上，按板卡及器件额定值测试；先关电核对连接，不接未知工业现场节点。"
      ],
      "bullets": [
        "冻结器件、初始化配置版本、ODR、FIFO 模式、总线层的 dummy 处理、驱动版本与读取长度；保存逻辑分析仪上的 CS / 时钟或 I²C 事务边界，确认 DMA 分段有没有结束总线访问。",
        "对比帧边界结束、半帧结束和同一 burst 内部分块三组读取；保存原始字节和设备 FIFO_LENGTH，检查完整样本只交付一次，不凭相似波形判断正确。",
        "在可控条件下延迟服务、改变配置并模拟总线错误；核验 skip、fifo_err、未知完成长度及重启都形成可见缺测边界，而不是无提示拼接。",
        "同时记录主机时间与尾部设备时钟，覆盖计数回绕及设备复位；只在明确时间映射和滤波条件后评价采样时间误差，另测最坏负载下服务期限。"
      ]
    },
    {
      "label": "07 / WHAT TRANSFERS",
      "title": "把“下一块从哪里开始”写进接口",
      "paragraphs": [
        "迁移练习：把事务 1 改成 26 字节，再读 13 字节。在相同无新增 / 无溢出假设下，应直接交付 A、B 再交付 C，没有半帧残片。再把 20 / 19 两块放进同一次 burst，说明为什么此时保留 7 字节尾片反而是正确操作。",
        "另一个练习：计数模差 64 tick，但中途有一次设备软复位，能否报告 2.5 ms 连续采样？不能。数据内容、事务边界、配置身份与时间锚点要一起成立；一个漂亮的数字不能补齐缺失前提。",
        "本文为原创解释与合成协议练习，未编译、执行或烧录厂商 / 候选代码，没有本站或独立第三方实物复现。没有复制厂商固件、图表或数据集；厂商资料与软件许可分别适用，公开下载不代表可任意再分发。案例保持待学习，不自动修改既有学习状态。"
      ]
    }
  ]
});
window.SensorCaseOverviews["bosch-bmi270-fifo-transaction"] = {
  "problem": "传感器 FIFO 每次只读固定字节数，可能读到半帧；下一次重发整帧，盲目拼接就会错位或重复。",
  "method": "先分清总线事务与内存分块，再只交付完整且身份明确的帧，并给时间锚点和缺测各自标清含义。",
  "boundary": "依据 BMI270 标准配置的厂商文档和原创合成反例；未板测，不是通用解析器或工业级适用性证明。",
  "takeaway": "读到字节不等于消费了帧；字节完整，也不等于样本连续或时间正确。"
};

// Original chop-overlap case; all sixteen prior cases retained unchanged.
window.SensorCases.push({
  "id": "ti-ads1262-chop-overlap",
  "maker": "TI",
  "title": "偏置消掉了，为什么连续读数仍不能当独立样本？",
  "subtitle": "ADS1262 · 全局 chop / 重叠转换 / 首结果与统计合同",
  "question": "每次 DRDY 都有新结果，是否表示又获得了一次独立、即时的测量？",
  "summary": "沿内部转换复用关系，分开偏置抵消、更新周期、动态响应与平均的不确定度。",
  "published": "2015-02",
  "revision": "ADS1262 / ADS1263 · SBAS661C · 2021-05 修订",
  "verified": "2026-10-31",
  "evidence": "厂商数据手册机制与时序表 + 本站原创重叠配对模型；非板卡噪声实测",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "error",
    "calibration",
    "debug"
  ],
  "conditions": "限定 ADS1262 的 ADC1、连续转换、全局 input chop 开启而 IDAC rotation 关闭；不是 ADS1263 的 ADC2。文档版本 SBAS661C，名义时钟 7.3728 MHz；时序示例选 400 SPS 档、sinc3、DELAY=0。未指定板卡、MCU 或固件；没有引脚、DMA 或可烧录寄存器脚本。内部转换符号仅用于解释，不声称主机可经 SPI 逐个读出这些内部量。",
  "sources": [
    {
      "id": "ds",
      "label": "TI ADS1262 / ADS1263 · SBAS661C：pp.62–64、73、84、91",
      "url": "https://www.ti.com/lit/ds/symlink/ads1262.pdf",
      "date": "电气正文首发 2015-02；Rev. C 2021-05；核验 2026-10-31。封装附录日期不当作电气正文修订。"
    }
  ],
  "blocks": [
    {
      "label": "01 / ONE NEW RESULT, TWO CONTRIBUTORS",
      "title": "抵消偏置的两次转换，会被下一份结果继续使用",
      "formula": "内部转换：C₁(正向)、C₂(反向)、C₃(正向)、C₄(反向)\n第一内部转换不单独输出\n校正结果：Y₁=(C₁−C₂)/2；Y₂=(C₃−C₂)/2；Y₃=(C₃−C₄)/2",
      "paragraphs": [
        "厂商机制：全局 chop 在内部反转输入极性，再组合两个转换来降低 ADC 输入偏置及其漂移。它是在已有斩波稳定 PGA / 调制器之外的选项，不是对输出数组轮流乘正负号，也不是本网站旧 RTD 案例的双 IDAC 激励交换。",
        "p.84 给出的序列不是互不相交的两两分组：C₂ 同时进入 Y₁、Y₂，C₃ 又进入 Y₂、Y₃。新 DRDY 对应新校正结果，但相邻结果共享一个内部转换。首结果要等两份贡献，稳态每多一份贡献便可更新一次。",
        "这些 C 只表示文档中的内部转换，不能把它们当作 SPI 提供的原始通道或自行拼接的 DMA 半缓冲。主机正常读取的是校正后的结果；本页没有实现芯片内部滤波器或输出接口。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "02 / CORRECTION HAS A TIME SPAN",
      "title": "常偏置能抵消，变化的信号却不能凭空变成“现在”",
      "formula": "原创模型：Cₖ=sₖxₖ−oₖ+nₖ，sₖ 交替为 +1、−1\n常偏置、无噪声：Yⱼ=(xⱼ+xⱼ₊₁)/2\n合成 x：10、12、14 mV → Y：11、13 mV，不是 12、14 mV",
      "paragraphs": [
        "xₖ 是人为指定的内部转换等效输入，oₖ 是偏置，nₖ 是加性噪声；这是解释组合关系的独立离散模型，不是器件的瞬时采样孔径、sinc3 波形或真实时间戳。若 x 与 o 在两次之间保持不变，代数上留下 x、消掉 o。",
        "若输入在变，结果包含两个转换的贡献。示例的 11 mV、13 mV 是相邻值的平均；把它标成最新的 12 mV、14 mV，会把平滑误当成没有延迟。实际每个内部转换本身也覆盖滤波历史，不能由这两个点的中点推算真实器件群延迟。",
        "偏置若在一对内变化，也不会完全抵消：正向后反向的一对留下 (o₂−o₁)/2。例如固定输入 10 mV，偏置从 0.10 变到 0.14 mV，输出为 10.02 mV。数值全是合成反例，不是器件漂移规格；热变化、前端偏置和校准仍要分别验收。"
      ]
    },
    {
      "label": "03 / LATENCY IS NOT THE UPDATE PERIOD",
      "title": "400 SPS 档，不等于 chop 后有 200 个独立结果",
      "formula": "表 9-13：400 SPS / sinc3，t₀=7.924 ms（chop、IDAC rotation 关闭）\nchop-only：T=t₀+D；首结果延迟=2T，稳态更新率=1/T\nD=0：首结果约 15.848 ms；之后约每 7.924 ms 更新，约 126.199 SPS\n另选 D=1.1 ms：首结果约 18.048 ms；稳态约 110.816 SPS",
      "paragraphs": [
        "以上按手册式 (19)、(21) 与表 9-38 复算，名义时钟为 7.3728 MHz，实际速率随时钟改变。表的建立前提是输入在启动前已稳定；t₀ 已是 DELAY=0 的启动到就绪时间，不再另加一次内部 52 µs。表值经过舍入，显示小数是为了可复算，不是测得的最坏延迟。",
        "关闭 chop 的稳态 400 SPS，与每次反转后重新建立所需的 7.924 ms，不是同一个周期。也不能用“每结果两次转换”直接把 400 除以 2；更不能把 126.199 当作每秒独立样本数。首结果两倍时间与后续一次更新间隔来自重叠序列。",
        "D=1.1 ms 只是手册支持的另一教学档位，不代表外部电路已建立。此处不启用 IDAC rotation，也不将 chop 与 IDAC 同时开启时的四倍首延迟套入本例。电源、参考启动、校准、总线服务和主机处理均不在该转换预算内。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "04 / OVERLAP CHANGES THE NOISE BOOKKEEPING",
      "title": "单个读数更安静，不代表再平均时仍能按独立样本算",
      "formula": "仅在独立、零均值、同方差内部噪声假设下：\nVar(Y)=σ²/2；Cov(Yⱼ,Yⱼ₊₁)=σ²/4；相邻相关系数=1/2\n4 个连续输出的均值：极性还原噪声 eₖ 的权重 [1,2,2,2,1]/8\n该模型方差=7σ²/32；误当独立则为σ²/8，低估 1.75 倍",
      "paragraphs": [
        "为看清复用，将按极性校正后的内部噪声记为 eₖ；符号翻转不改变假设中的方差。输出噪声为 (eⱼ+eⱼ₊₁)/2，相邻两项共享 eⱼ₊₁，因此有协方差。这里的 1/2 是本站受限模型推导，绝不是 TI 报告的器件相关系数。",
        "4 个输出只覆盖 5 个内部贡献，且中间 3 个各被使用两次。对权重平方求和得到 14/64=7/32；若仅拿单输出方差 σ²/2 再除以 4，就漏掉了相关项。更多输出、更多小数位，都不能凭空补出独立信息。",
        "手册提到 chop 因两次平均使噪声约降低 1.4 倍；本页不据此为任意带宽或滤波设置承诺相同改善。真实内部噪声可能相关、有色或非平稳，实物还含参考、传感器和环境贡献；应从保存的原始输出检查自相关、长期漂移和平均时间，再报告不确定度。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "05 / DELAY BELONGS AT THE RIGHT BOUNDARY",
      "title": "主机晚一点读取，不会替内部换向补上建立时间",
      "paragraphs": [
        "p.64 说明，chop / IDAC rotation 所需的额外外部建立时间，只能由 DELAY 位提供。启动前由主机等待一次，不等于每次内部换向后都等待；DRDY 后再睡一会儿，也不会改变已经完成的转换。延迟应放在产生误差的边界上，而不是放在日志打印前。",
        "本页不猜外部 RC、驱动器或输入电流的具体响应，不给通用等待值。真实验收应区分模拟建立、内部数字滤波、读取服务、配置切换与校准；手册关于连续转换输入阶跃的表 9-15 注明 chop 和 IDAC rotation 关闭，不能原样当作本模式阶跃响应。",
        "本站建议的交付记录保留配置代际、chop/滤波/DELAY 设置、原始输出、就绪与主机读取时刻及有效标志。配置改变、重启或读数丢失时明确分段；不要用旧均值填满缺口，也不要把主机到达时间声称为内部采样时刻。该记录合同不是寄存器映射或完整驱动。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。只使用安全隔离的低压输入与符合器件额定值的台架；先核对输入共模、参考与供电，换接前断电。本站只运行原创离线模型，不运行厂商候选程序。"
      ],
      "bullets": [
        "冻结芯片、板卡、时钟、滤波、chop 与 DELAY 配置及校准状态。分别记录 START、DRDY、CS 与原始输出，量首结果和后续更新间隔，不仅统计每秒回调次数。",
        "先用稳定低压输入比较 chop 开关前后的偏置与噪声，再以独立保留数据评价；输入、增益、带宽与温度保持可比，不能把校准拟合残差当独立精度。",
        "在安全范围内施加可控慢斜坡和阶跃，扫 DELAY 并保存完整时间线；分别检查动态误差、建立期与主机服务延迟，不把教学中点模型当真实群延迟。",
        "用连续原始输出评估相关性和不同平均长度的误差；覆盖重启、配置改变、漏读与恢复，确认缺口可见、旧段不会被当作新配置的独立有效样本。"
      ]
    },
    {
      "label": "07 / COUNT CONTRIBUTIONS, NOT CALLBACKS",
      "title": "迁移练习：平均的对象，先画出谁和谁重叠",
      "paragraphs": [
        "练习一：把内部贡献改为 10、10、14、14 mV，在常偏置、无噪声的模型中得到 10、12、14 mV。中间的 12 不是一个新的物理输入台阶，而是组合跨越了变化；真实器件阶跃响应仍需要完整滤波与模拟模型。",
        "练习二：保留连续 4 个输出，先写出 5 个内部贡献的权重，再与只取互不重叠配对比较。只有在本例独立内部噪声假设下，不重叠两对才没有共享噪声项；不要由此建议无条件丢掉一半实际数据。应用要同时权衡带宽、更新率和不确定度。",
        "与旧 RTD 激励交换、ADS1256 换路吞吐案例相比，本例的新重点是同一内部贡献被连续校正输出复用，导致“新结果”“独立信息”“最新时刻”三者不能等同。可把这种检查用于任何重叠窗口，但要重新证明对应实现的权重与假设。",
        "TI 手册保留其版权；本文仅链接资料并提供原创解释与合成代数测试，不复制厂商图表、固件或数据集。未下载、编译、执行或烧录候选工程，没有本站或独立第三方实物复现。新案例保持待学习，不推断或改变已有学习完成状态。"
      ]
    }
  ]
});
window.SensorCaseOverviews["ti-ads1262-chop-overlap"] = {
  "problem": "ADC 打开偏置抵消后，每次都有新读数，却可能复用上一次的内部转换，平均效果和时间含义容易被误判。",
  "method": "画出连续结果共享哪次转换，再分别计算首结果延迟、稳态更新间隔与重叠噪声的协方差。",
  "boundary": "依据厂商手册与原创离散模型，未做板卡实验；相关系数是条件化推导，不是器件实测或完整滤波仿真。",
  "takeaway": "新读数不等于独立信息；偏置被抵消，也不等于变化中的输入被无延迟地测到。"
};

// Original oversampling-interruption case; all seventeen prior cases retained unchanged.
window.SensorCases.push({
  "id": "st-l476-oversampling-interrupt",
  "maker": "ST",
  "title": "平均攒够了四次，为什么还不能当作一段连续采样？",
  "subtitle": "STM32L476 · 硬件过采样 / 注入抢占 / 样本年龄与饥饿",
  "question": "更高优先级的注入转换打断平均时，应该保留旧贡献，还是全部重来？",
  "summary": "从累加器的保留与清零规则，分清输出能否完成、贡献是否连续，以及结果还有多旧。",
  "published": "2015-06",
  "revision": "AN4629 Rev. 1；RM0351 Rev. 11（2026-04）；ES0250 Rev. 13（2025-05）",
  "verified": "2026-11-01",
  "evidence": "厂商手册、应用笔记与勘误 + 本站原创完成事件模型；非芯片时序或噪声实测",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "error",
    "debug"
  ],
  "conditions": "限定 STM32L476 单 ADC、单 regular 通道硬件过采样，ROVSE=1、JOVSE=0、TROVS=0，比较 ROVSM=0/1；预置注入序列，不使用 auto-injected、dual ADC、动态 JSQR 或中途 JADSTP。文档版本按实际 PDF 封面及修订历史，不把网页索引更新时间当修订日。没有指定板卡、引脚、触发源、ADC 时钟或 DMA 映射；以下模式字段不是完整可烧录配置。",
  "sources": [
    {
      "id": "rm",
      "label": "ST RM0351 Rev. 11：§18.4.30，pp.556–561；ADC_CFGR2 pp.594–595",
      "url": "https://www.st.com/resource/en/reference_manual/rm0351-stm32l47xxx-stm32l48xxx-stm32l49xxx-and-stm32l4axxx-advanced-armbased-32bit-mcus-stmicroelectronics.pdf",
      "date": "首版 2015-05-28；本版 2026-04-02（封面 April 2026）；核验 2026-11-01。"
    },
    {
      "id": "an",
      "label": "ST AN4629 Rev. 1：ADC hardware oversampling for microcontrollers of the STM32 L0 and L4 series",
      "url": "https://www.st.com/resource/en/application_note/dm00150423.pdf",
      "date": "June 2015，DocID027261 Rev. 1；核验 2026-11-01。"
    },
    {
      "id": "errata",
      "label": "ST ES0250 Rev. 13：器件修订表；§2.8.11，p.28",
      "url": "https://www.st.com/resource/en/errata_sheet/es0250-stm32l471xx475xx476xx486xx-device-errata-stmicroelectronics.pdf",
      "date": "本版 2025-05-26（封面 May 2025）；核验 2026-11-01。"
    }
  ],
  "blocks": [
    {
      "label": "01 / ONE OUTPUT IS A GROUP",
      "title": "先分清“一次触发”和“一份输出”",
      "formula": "本例 N=4，等权算术平均 y=(x₁+x₂+x₃+x₄)/4\nTROVS=0：一次 regular 触发启动整组连续子转换（仍可被 injected 打断）\nTROVS=1：每个子转换分别等待触发；不是本例 continued 模式",
      "paragraphs": [
        "STM32L476 的硬件过采样把多次转换先累加、再移位交给输出寄存器。它不是 CPU 收到四次普通结果后才做平均，也不能直接照搬本站 STM32F407 软件平均的回调计数。AN4629 给出硬件思路，具体抢占规则以本器件 RM0351 为准。",
        "本例用 4 次、右移 2 位解释等权平均；字段名以 ADC_CFGR2 的 OVSR、OVSS 定义为准，不能照抄 p.556 叙述中的 OVFS 拼写。没有由此承诺多出多少有效位、改善多少绝对精度；输入噪声、相关性、建立时间和数据格式仍是独立条件。",
        "p.558 图 113 区分整组触发和逐子转换触发。触发是请求，子转换是贡献，输出是组的交付，三者不能共用一个计数器来证明采样正确。正文后面的时间单位是原创教学时隙，不是该器件的 ADC 周期或吞吐规格。"
      ],
      "sourceIds": [
        "rm",
        "an"
      ]
    },
    {
      "label": "02 / KEEP OR RESTART",
      "title": "continued 保留贡献；resumed 放弃旧累积",
      "formula": "ROVSE=1、JOVSE=0、TROVS=0：\nROVSM=0 / continued：保留注入前已完成且有效的子转换\nROVSM=1 / resumed：清空旧累积，注入结束后从第 1 次重新凑满 N 次",
      "paragraphs": [
        "手册 p.559 的 continued 不是保留正在被中止的半次转换，而是从最后有效的贡献继续。只要注入之间仍能完成 regular 子转换，组可以跨多个空隙积累完成；但“最终攒够”并不保证四次来自同一段连续时间。",
        "resumed 让最终一组来自注入之间的连续转换段，代价是前面已花时间获得的贡献会被丢掉。如果每个空隙都不够完成整组，它可以一直无法交付 regular 结果；注入路径仍在工作，并不表示 regular 路径有进展。",
        "组合限制不能只看一幅图：图 114 标注 TROVS=X，但 p.560 的说明和 p.561 表 119 明确，TROVS=1 与注入共用时强制 resumed，JOVSE 必须为 0，ROVSM=0/TROVS=1 列为不支持。因此本文固定 TROVS=0；也不把两个组都开过采样时的规则混进来。"
      ],
      "sourceIds": [
        "rm"
      ]
    },
    {
      "label": "03 / COUNT THE AGES",
      "title": "四个数一样多，覆盖的历史却不一样",
      "formula": "原创时隙模型：regular 完成时刻 1、2；注入占用 (2,5]；随后完成 6、7、8、9\ncontinued 首组：[1,2,6,7]，在 7 交付，完成时刻代理均值=4，跨度=6\nresumed 首组：[6,7,8,9]，在 9 交付，完成时刻代理均值=7.5，跨度=3\n合成 x(t)=100+4t：continued=116，resumed=130；各自最新贡献为 128、136",
      "paragraphs": [
        "模型只接收已经完成的 regular 事件和一次清零 / 保留事件；每个 regular 占 1 个时隙，注入占 3 个时隙。规定 t=2 的完成先入账，再处理注入。这是自定义事件顺序，不是对芯片同时到达边沿、抢占延迟或转换孔径的断言；未完成的尝试不入账。",
        "用完成时刻作为人为输入 x(t) 的索引，continued 输出比它最后一份贡献小 12 个合成码值，resumed 小 6 个。相应的完成时刻代理年龄是 7−4=3 与 9−7.5=1.5 个时隙。这些只是线性教学信号上的平均关系，不是实际 ADC 的采样时间戳、群延迟或电压误差规格。",
        "两种结果交付时刻不同，不能只看 116 与 130 谁更接近某个固定数就评判精度。continued 更早凑齐，却含注入前的历史；resumed 更晚交付，但本组连续。控制或诊断任务要先决定最大允许年龄、连续性与期限，再选策略，而不是只要求“每组四次”。"
      ]
    },
    {
      "label": "04 / LIVENESS IS A SEPARATE CONTRACT",
      "title": "不允许混合历史，也可能意味着一直没有新结果",
      "formula": "重复模式：R、R、I、I、I（R 为完成的 regular，I 为注入占用时隙）\n每个空隙只有 2 个有效 R，小于 N=4\ncontinued：第二个空隙可交付首组；resumed：每次只攒到 2 就清零\n若该模式无限持续，resumed 永远无首组；有限测试只能证明观察区间内无输出",
      "paragraphs": [
        "这里仍采用先完成、后注入的明确模型顺序，不预测硬件恰好同沿时谁先执行。离线测试把这个模式重复若干次，检查 continued 的贡献既不丢失也不重复，resumed 则没有输出；随后留出 4 个连续 regular 完成事件，检查 resumed 能恢复交付，不残留旧贡献。",
        "手册所说的注入周期必须足够大，不能简化为只拿两个触发沿相减：注入序列自身占用时间、被中止的尝试及实际 ADC 条件都会吃掉可用空隙。反过来，continued 的“至少能完成一个子转换”也不是有限最坏延迟保证；如果空隙间等待没有上界，输出年龄就没有统一上界。",
        "应用应另设 regular 结果期限和配置代际：超期时标记无新有效结果，不把上一次寄存器值重新盖上当前主机时间。记录触发、交付与接收时刻的不同含义；中断次数、DMA 回调或注入 JEOC 都不能替 regular 完成与新鲜度作证。本页没有实现这些外设或恢复驱动。"
      ],
      "sourceIds": [
        "rm"
      ]
    },
    {
      "label": "05 / ERRATA ARE NOT AVERAGED AWAY",
      "title": "累加器规则正确，不等于每个贡献都可信",
      "paragraphs": [
        "ES0250 Rev. 13 的 §2.8.11 指出：距上次 ADC 转换或校准超过 1 ms 后的转换结果可能错误；给出的处理是连续做两次、弃首留次。STM32L476 的修订 3（REV_ID 0x1003）与修订 4（0x1007）均须核对此项。不能仅因开了四次平均，就宣称首个错误贡献已经被消除。",
        "本模型假定所有入账的 regular 值有效，不模拟该勘误、ADC 内部状态或模拟前端。硬件验收要单独覆盖空闲后恢复，明确哪次转换被舍弃、何时允许进入累加器，并证明操作符合实际模式；本文不提供一个未经验证的“多读一次”补丁。",
        "为隔离问题，本文不热改注入序列、不发中途停止，也不使用双 ADC 或自动注入；这些配置有各自的手册与勘误边界。4 次、右移 2 的例子只研究贡献的时间分组，不验证所有比率的截断、舍入、阈值比较或 ENOB。"
      ],
      "sourceIds": [
        "errata",
        "rm"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。只在安全隔离、符合器件输入与供电额定值的低压台架测试，换接前断电；本站仅运行原创离线模型，不运行候选固件。"
      ],
      "bullets": [
        "冻结 STM32L476 具体料号、REV_ID、板卡、时钟、采样时间、regular / injected 序列及模式字段；先用手册与勘误逐项审查，再确定实际触发、引脚和读取路径，不从本文推定映射。",
        "先无注入建立基线，再在安全输入上加入可控注入与慢斜坡；保存触发、regular 完成和主机接收的证据，比较 continued 与 resumed 的交付间隔和动态偏差，不拿完成回调时间充当采样孔径。",
        "逐步缩短可用 regular 空隙，确认 resumed 超期能被显式发现；停止高频注入后核验恢复组身份，continued 则检查最旧贡献的允许年龄与长间隔边界。",
        "覆盖校准后 / 空闲超过 1 ms 后恢复、丢失读取及配置变更；独立验证勘误处理和有效标记，不以平均值看起来平滑、注入仍有中断或程序未死机作为验收。"
      ]
    },
    {
      "label": "07 / AVERAGE HAS A HISTORY",
      "title": "迁移练习：换掉等待时间，不要偷偷换掉问题",
      "paragraphs": [
        "练习一：把唯一一次注入占用从 3 改为 8 个时隙。continued 的贡献时刻变为 1、2、11、12，均值 6.5，交付时代理年龄 5.5；resumed 为 11、12、13、14，均值 12.5，年龄仍 1.5，但首结果更晚。增加等待并没有增加一份独立测量信息。",
        "练习二：固定同一个常量输入，两种模式可能给出相同均值。这个测试能检查算术，却不能证明动态新鲜度或不会饥饿；要加入时间变化和缺少足够空隙的反例。与旧 F407 软件平均、C2000 多通道 burst 不同，本例核心是抢占时硬件累加器的保留 / 清零语义。",
        "厂商文档保留各自版权；本文只链接原始资料，提供原创解释、合成事件与算术测试，没有复制厂商图表或固件。未下载、编译、执行或烧录候选代码，没有本站或独立第三方实物复现；不是完整驱动或工业适用性证明。新增案例保持待学习，不改变既有学习状态。"
      ]
    }
  ]
});
window.SensorCaseOverviews["st-l476-oversampling-interrupt"] = {
  "problem": "ADC 平均被高优先级转换打断时，保留旧数据会混合不同年龄，全部重来又可能迟迟没有新结果。",
  "method": "先列出一份平均由哪些完成事件贡献，再分别检查连续性、最旧贡献年龄与结果交付期限。",
  "boundary": "依据 STM32L476 厂商手册和原创事件模型，未板测；时隙不是器件时钟，模式字段不是可烧录配置。",
  "takeaway": "攒够次数不等于连续采样；保持连续，也不等于一定能按时得到新读数。"
};

// Original PDB COCO handshake case; all eighteen prior cases retained unchanged.
window.SensorCases.push({
  "id": "nxp-s32k144-coco-handshake",
  "maker": "NXP",
  "title": "ADC 已经转完，为什么下一轮硬件触发还会停住？",
  "subtitle": "S32K144 · PDB / ADC 握手 · 完成标志电平与新边沿",
  "question": "结果晚一点再读，影响的可能不只是数据保存，还会影响下一轮触发吗？",
  "summary": "沿 PDB 锁、ADC 完成标志与结果读取的反馈关系，分开转换完成、结果消费和触发恢复。",
  "published": "2018-08",
  "revision": "公开历史版：AN12217 Rev. 2.0（2024-09-05）；S32K1XXRM Rev. 13（2020-04）",
  "verified": "2026-11-02",
  "evidence": "厂商公开历史手册、应用笔记与官方技术答复 + 本站原创握手事件模型；非板测或最新版配置认证",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "debug",
    "error"
  ],
  "timingRelated": true,
  "conditions": "仅讨论 AN12217 历史示例中的 S32K144、PDB0 channel 0 到 ADC0 的 direct path，预触发 4–7 对应 SC1E–H；关闭比较与硬件平均及连续转换（ACFE=0、AVGE=0、ADCO=0），不动态写 SC1，不讨论跨 PDB channel 仲裁。所读版本为公开 AN12217 Rev. 2.0 与 RM Rev. 13，非官网目录列出的需账号新版本；当前板卡、掩膜版勘误和完整配置尚未验收。没有给出可直接使用的引脚、DMAMUX、IRQ、时钟树或恢复寄存器脚本。",
  "sources": [
    {
      "id": "an",
      "label": "NXP AN12217 Rev. 2.0：§4.2–4.3，pp.11–13；§6.3 S32K144 示例",
      "url": "https://www.nxp.com/docs/en/application-note/AN12217.pdf",
      "date": "首版 August 2018；实际读取 PDF 为 2024-09-05 Rev. 2.0，30 页；核验 2026-11-02。"
    },
    {
      "id": "rm",
      "label": "NXP S32K1XXRM Rev. 13：COCO p.1222；DMAEN p.1232；PDB §46.4.1 p.1338",
      "url": "https://community.nxp.com/pwmxy87654/attachments/pwmxy87654/S32K/13899/1/S32K-RM%20%28Rev.%2013%2C%2004%202020%29.pdf",
      "date": "April 2020，Rev. 13；NXP 公开社区附件的完整历史手册；核验 2026-11-02，不称最新版。"
    },
    {
      "id": "support",
      "label": "NXP TechSupport：Sequence Error with FTM-PDB-ADC Triggering",
      "url": "https://community.nxp.com/t5/S32K/Sequence-Error-with-FTM-PDB-ADC-Triggering/td-p/1037615",
      "date": "PetrS 答复 2020-03-03；原提问设备是 S32K146，仅作为同系列机制的补充答复，不冒充 S32K144 实测。"
    },
    {
      "id": "versions",
      "label": "NXP S32K1 官方文档目录：公开版与需账号新版的边界",
      "url": "https://www.nxp.com/products/S32K1?tab=Documentation_Tab",
      "date": "核验 2026-11-02：目录列 RM 14.2（2026-02-10）、AN12217 3.0（2026-03-23）为 Account Required；未登录或读取其受限正文。"
    }
  ],
  "blocks": [
    {
      "label": "01 / COMPLETION FEEDS BACK",
      "title": "自动采样链不只有向前的数据流",
      "formula": "请求：PDB 预触发 / trigger → ADC 转换\n反馈：对应 SC1n 的 COCO 新上升沿 → PDB 预触发锁释放\n消费：读取对应 Rn → COCO 清零，为后续新上升沿准备",
      "paragraphs": [
        "常见直觉是“定时器管采样，CPU 只要之后把结果搬走”。这个例子多了一条反馈：PDB 触发后的锁要看到对应 ADC 完成标志的新上升沿，才能解除。结果寄存器的读取不仅取得数值，也改变下一次反馈能否形成的条件。",
        "AN12217 的 direct path 示例使用预触发 4，背靠背示例扩展到 4、5、6、7，对应 ADC0 的 SC1E–H。它是在同一个外部模拟通道 12 上连续转换四次，不是四个模拟引脚，也不是把软件数组的下标直接接到 ADC 引脚。这里只复述来源明确的对应关系，不据此提供板级映射。",
        "本文读到的直链 PDF 仍是 Rev. 2.0，RM 是公开历史 Rev. 13。官网目录已有需账号的新版本，本次没有登录或读取受限正文。因此这是固定公开版本的机制案例，不是最新手册或现行掩膜版勘误审查完成的证明。"
      ],
      "sourceIds": [
        "an",
        "rm",
        "versions"
      ]
    },
    {
      "label": "02 / LEVEL IS NOT AN EDGE",
      "title": "“COCO 还是 1”不等于“又来了一次完成反馈”",
      "formula": "锁 L 与完成标志 C 分开记：\n接受预触发：L←1\n转换完成且 C 原为 0：C 由 0→1，产生新边沿，L←0\n转换完成但 C 原为 1：没有新的 0→1\n读结果：C←0；它本身不是 COCO 上升沿",
      "paragraphs": [
        "RM p.1338 写的是上升沿释放锁，不是一直保持高电平就持续解锁。第一次完成已把 COCO 置 1；若一直没有重新清零，下一次完成不能凭“再置 1”制造第二个上升沿。转换器内部可能已不忙，反馈锁却仍然活跃，所以只检查忙状态并不足够。",
        "RM p.1222 还说明，写对应 SC1n 也会清 COCO；不能说读取是唯一清除方式。但本文固定配置，不把运行中改 SC1 当成无副作用的补救。比较、硬件平均、校准以及配置写入会改变完成标志条件，不能把简化模型扩展成所有 ADC 模式的状态机。",
        "2020 年官方支持答复也要求读取结果，使 COCO 清零后可以再次置位；原问题设备是 S32K146，不是本站 S32K144 台架复现。本文的芯片范围来自所读手册及应用笔记，社区答复只作补充，不用网友的时钟或 DMA 数字替自己完成配置核验。"
      ],
      "sourceIds": [
        "rm",
        "support"
      ]
    },
    {
      "label": "03 / A SMALL FAILURE TRACE",
      "title": "少一次读取，可能隔一轮才暴露为停流",
      "formula": "原创单结果槽模型：pretrigger 4 → SC1E / R[4]；时间单位任意，转换耗时 3：\nt=1 请求 → t=4 完成：C 0→1，L 1→0\n未读取；t=11 再请求 → t=14 完成：C 仍为 1，L 仍为 1\nt=15 才读结果：C→0，但没有新的完成边沿\nt=21 再请求：同通道仍有锁，模型置 ERR 并拒绝触发",
      "paragraphs": [
        "这是根据公开握手关系写出的抽象反例，不是 S32K 的周期精确仿真。1、4、11、14、15、21 是人为事件时刻，不是 PDB 的 DLY 寄存器值；尤其不能把模型起点改成零就推导器件允许零延迟预触发。模型不包含内部同步器、模拟采样、触发 gasket、DMA 或中断延迟。",
        "第一次完成释放了当时的锁，所以即使结果未及时读取，下一次请求仍可能被接受；但旧高电平没有重新准备好。原模型检查的是这种延后显现的失败路径，不能用“刚才又成功转换一次”证明服务期限足够。正常对照是在 t=5、15、25 分别读出，每次完成后都重新准备下一次边沿。",
        "t=15 的迟到读取和随后单独清 ERR，都不能在模型里凭空产生 COCO 上升沿。这个结论只是“两个动作不等价”，不是建议某种寄存器写序列可以通用恢复。真实恢复还须处理当前转换、锁、错误、未读结果、触发入口与配置身份，丢失的历史不能靠重启补造。"
      ],
      "sourceIds": [
        "rm"
      ]
    },
    {
      "label": "04 / TWO DIFFERENT BUDGETS",
      "title": "留够转换时间，也要留出结果服务余量",
      "formula": "另设保守应用策略：本轮读出 + 余量 G 在下轮请求前完成\n假设周期 P=10、转换时间 T=3、读出延迟 L=5、G=1\nT+L+G=9 < P，余量为 1 个教学时间单位\nL=8 则 12 > 10：违反该策略；不因此断言硬件必然失效",
      "paragraphs": [
        "转换时间约束防止新预触发撞上尚未完成的转换；结果服务约束则防止完成标志一直未被重新准备。它们不是同一条预算。这里人为选择“下轮请求前读完”的充分性策略，留出 G，便于验收；没有宣称这是芯片唯一或最晚允许的读出期限。",
        "例如抽象模型中，上一份结果在 t=12 读取，虽然晚于第二轮 t=11 请求，却仍早于 t=14 完成，因此第二次边沿可以出现。这特意展示“保守策略失败”不等于“硬件必坏”。实际允许窗口与读写交叠语义要按所用器件版本验证，不在同沿边界上赌先后。",
        "背靠背转换也不是零间隔的同时采样：历史 RM 说明，收到相应 acknowledgment 后再过 2 个外围时钟周期发出下一个背靠背预触发，并忽略该项 delay。这个固定管线关系不等于完整 ADC 转换时间，更不等于 CPU 回调时刻；从首请求到整组读出仍要分别预算。"
      ],
      "sourceIds": [
        "rm"
      ]
    },
    {
      "label": "05 / READ THE RIGHT RESULT",
      "title": "自动搬运可以分担服务，但不能混淆请求来源",
      "paragraphs": [
        "ADC_SC2[DMAEN] 对应 ADC 转换完成事件的 DMA 请求；PDB_SC[DMAEN] 则与 PDBIF 事件相关。两处都叫 DMAEN，却不能互换：用定时事件搬数据，不自动证明所读结果已完成，更不证明读的是该次需要清 COCO 的结果槽。本文没有给出未经核对的 DMAMUX 源号或传输描述符。",
        "背靠背例子包含 E、F、G、H 四个配置 / 结果槽。只在最后一项有中断，不等于前面每个结果都已被消费。应用应核验实际读地址、每项完成与读取顺序，以及整组配置代际；不要把“收到了一个完成回调”直接当作四项新结果齐全。",
        "RM 的序列错误检测限定于同一个 PDB channel 内的预触发；跨 PDB channels 的冲突不能靠“ERR 没置位”证明安全。发生异常后，建议先停止向应用交付未经确认的组，保存证据并划出缺测段；重新允许触发前，要由具体版本验证的流程重新建立一致状态。这是验收合同，不是已修好的驱动。"
      ],
      "sourceIds": [
        "rm",
        "an"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。仅在安全隔离、符合额定值的低压开发板与模拟输入上测试，不连接未知工业节点或电机功率级；换接前断电。本页只运行原创离线模型，不运行候选工程。"
      ],
      "bullets": [
        "冻结 MCU 具体料号、掩膜版、板卡、实际时钟、公开 / 已获授权的手册版本及适用勘误；先核 direct path 与结果槽，不把历史示例当作最新完整映射。",
        "保存每次请求、可观察完成状态、读取地址 / 次数和 PDB 错误；分别制造转换间隔不足与读出服务延迟，对照排查，不用单一 ISR 计数判断链路正常。",
        "从一项转换验证后再扩展四结果槽；检查读取覆盖、最坏负载及 DMA / CPU 所有权，观察工具读取结果寄存器本身也可能改变标志，避免调试器替程序悄悄清状态。",
        "中断读取服务后按独立审查的流程停止、清理并重建触发链；给恢复后首个有效组标记新代际，检查旧数据、缺项、重复与期限，不保证某一清 ERR 或开关 PDB 的脚本普适。"
      ]
    },
    {
      "label": "07 / CONSUMPTION CAN BE CONTROL",
      "title": "迁移练习：把取数和重计算分开验收",
      "paragraphs": [
        "练习一：把迟到读数从 t=15 移到 t=12。模型第二次完成会形成新边沿；再移回 t=15，读动作仍发生过，却已错过该次边沿重新准备的窗口。写清时间顺序，比一句“我已经读过 ADC”更能定位问题。",
        "练习二：四槽记录里只有 E、F、H，或 H 来自上一轮。即使数值都在正常范围，也不能交付成完整的新组。这个外部身份检查不等于芯片会替你标上序号；真正的生产者、消费者、配置代际和异常恢复还需自己设计并验证。",
        "与旧 STM32 overrun、缓存可见性和 L476 过采样案例不同，本例的新增重点是消费结果对下一次硬件反馈边沿的影响。可及时取走结果、随后再计算，但必须分别证明取数期限和后续缓冲所有权，不能把 CPU 更空闲当作证据。",
        "厂商资料保留各自版权；本文提供原创解释、合成事件与边界测试，不复制厂商图表或固件。未下载、编译、执行或烧录候选项目代码，没有本站或独立第三方实物复现；不是量产配置、现行勘误覆盖或汽车安全资格证明。新案例保持待学习，旧内容与用户学习状态不变。"
      ]
    }
  ]
});
window.SensorCaseOverviews["nxp-s32k144-coco-handshake"] = {
  "problem": "ADC 已经完成转换，结果却迟迟没有读走；完成标志停在高电平，可能让下一轮触发失去新的反馈。",
  "method": "把请求、完成标志边沿、结果读取与锁状态分开画成时间线，再分别验证转换间隔与取数服务期限。",
  "boundary": "依据公开历史手册与原创握手模型，未板测；需账号新版未读取，不能当最新配置或通用恢复驱动。",
  "takeaway": "完成过一次不等于又完成一次；读取结果有时也是下一轮硬件控制成立的条件。"
};


// Public-source bus-participation case; no firmware or hardware execution.
window.SensorCases.push({
  "id": "adi-adxl355-shared-sda-ack",
  "maker": "ADI",
  "title": "地址不冲突，为什么总线应答仍会出错？",
  "subtitle": "ADXL355 · 共享 SDA / 非目标应答 / 拓扑与验收",
  "question": "扫描到两个不同地址，就能证明它们适合共用一条 I²C 总线吗？",
  "summary": "先核对数据阶段的参与者，再把字节内容、应答来源与总线隔离分开验证。",
  "published": "2025-06",
  "publicationLabel": "所读版本发布",
  "revision": "ADXL354/ADXL355 Rev. D · 2025-06；UM10204 Rev. 7.0 · 2021-10-01",
  "verified": "2026-11-03",
  "evidence": "厂商数据手册限制 + 协议原文 + 原创逻辑反例",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "debug",
    "adc"
  ],
  "timingRelated": false,
  "conditions": "仅讨论数字输出 ADXL355 的 I²C 接口，不是模拟输出 ADXL354。固定所读资料版本为 Rev. D（2025-06），ADXL355 的 7 位地址设为 0x1D 或 0x53，且与另一器件共享 SDA。没有指定 MCU、外设实例、引脚映射、驱动或固件版本，也没有推定某系列 MCU 能修复此器件限制。本文仅给出文档分析与离线逻辑模型，不提供实际接线或热切换脚本。",
  "sources": [
    {
      "id": "adxl",
      "label": "ADI ADXL354/ADXL355 Rev. D · p.29 I²C Protocol；p.2 版本日期",
      "url": "https://www.analog.com/media/en/technical-documentation/data-sheets/adxl354_adxl355.pdf#page=29",
      "date": "所读 Rev. D：2025-06；不是本次新发布"
    },
    {
      "id": "i2c",
      "label": "NXP UM10204 Rev. 7.0 · §§3.1.1、3.1.6、3.1.10",
      "url": "https://www.nxp.com/docs/en/user-guide/UM10204.pdf",
      "date": "所读 Rev. 7.0：2021-10-01；协议背景，非 ADXL355 合格证明"
    }
  ],
  "blocks": [
    {
      "label": "01 / PAYLOAD IS NOT AN ADDRESS",
      "title": "看的是数据字节，不只是地址表",
      "paragraphs": [
        "厂商明确限制：Rev. D p.29 说明，ADXL355 即使未被寻址，也可能在共享 SDA 上传输特定数据字节时应答并拉低 SDA。地址设为 0x1D 时对应 0x3A/0x3B；设为 0x53 时对应 0xA6/0xA7。其他器件的读写数据中也可能出现这些值，通信可能被打断。",
        "因此，只有地址扫描和几次正常读数的验证不够。本站分析：一个系统可能长期只发送有限范围的数据，直到量程变化、负数编码或某个计数值出现才暴露问题；不能因为失败与“数据值”一起变化，就先归因于模拟传感器饱和。此处是故障假设，不是对任何实际产品的诊断。"
      ],
      "sourceIds": [
        "adxl"
      ]
    },
    {
      "label": "02 / ACK HAS NO NAME TAG",
      "title": "线上看到低电平，并不告诉你是谁拉低的",
      "paragraphs": [
        "协议背景：普通双向 I²C 用开漏或开集方式实现线与。每字节后的第九个时钟是应答位，发送方释放 SDA，由接收方拉低表示 ACK；保持高电平表示 NACK。7 位目标地址与读写方向共同组成地址字节。",
        "本站推论：在一个观察点只看到 ACK，不能唯一反推出响应者身份。若预期接收方想表达 NACK，非目标器件却拉低 SDA，观察到的总线电平便不再能代表预期接收方的意图。即使双方都拉低，也可能在电平上看不出有额外参与者。这个逻辑反例并不保证每次命中特定字节都导致同样的后续故障。"
      ],
      "sourceIds": [
        "i2c"
      ]
    },
    {
      "label": "03 / AN ORIGINAL COUNTEREXAMPLE",
      "title": "六个合成字节，分开检查两种地址配置",
      "formula": "教学载荷：[0x11, 0x3A, 0x3B, 0xA6, 0xA7, 0x55]\n7 位地址 a 的两个方向字节：2a 与 2a+1\na=0x1D → 0x3A/0x3B；a=0x53 → 0xA6/0xA7\n模型：观测到 ACK = 预期接收方 ACK 或 非目标方拉低 SDA",
      "paragraphs": [
        "原创离线模型只枚举完整字节的风险条件：固定上述载荷，共享 SDA 且 ADXL355 地址为 0x1D 时标出第 2、3 个字节；改成 0x53 时改标第 4、5 个字节。换地址只是移动了命中集合，不是证明任意载荷安全。两个配置各自遍历 0…255 字节时均有两个风险值，不能把这个计数写成真实故障概率。",
        "再人为令预期接收方不应答：普通字节的抽象 ACK 结果为假，风险字节却可因旁路拉低而为真。令预期接收方本来就应答，两者电平结果相同。模型帮助说明“有 ACK”不足以验明来源，而不是模拟 ADXL355 内部状态机、总线波形或 MCU 错误标志。",
        "独立 SDA 对照仅在逻辑模型里取消另一总线的可见性，风险标记随之消失；真实硬件仍须验证隔离、电平、上电状态、负载与引脚复用。本站未测量 ACK 宽度、恢复时间、错误率或吞吐，也没有运行厂商工程。"
      ]
    },
    {
      "label": "04 / FIX THE TOPOLOGY CONTRACT",
      "title": "优先把共享条件移除，而不是反复补救软件",
      "paragraphs": [
        "厂商给出的解决方向之一是让 ADXL355 连接独立 SDA。本站将它作为需要电路审查的结构方向，不把它简化成“随便换一个 GPIO”：MCU 控制器资源、引脚复用、电平、上拉、上电状态和板上连通性都必须另行确认。",
        "同页的替代办法写作 CS/SCL 并称通常接地；但 p.12 Table 9 把 pin 1 CS/SCL 定义为 I²C 时钟，把 pin 2 SCLK/VSSIO 定义为 I²C 模式选择，p.29 另一段也要求后者接地。本文保留这处命名不一致，不自行猜测应切哪一脚，不展开热切脚、GPIO 接管或切换模式操作；也没有宣称不改硬件即可可靠消除问题。",
        "本站分析：重试只说明重新传了一次，未改变共享 SDA 和同一载荷时，原触发条件仍可能存在。应用校验能帮助发现异常，不等于恢复了电气隔离；若目标协议没有端到端校验，也不能凭空假定 CRC 会保护数据。暂不因 ACK 正常而交付未验证的测量值。"
      ],
      "sourceIds": [
        "adxl"
      ]
    },
    {
      "label": "05 / CONTENT AND TIMING ARE DIFFERENT",
      "title": "降低负载不等于排除了非目标响应",
      "paragraphs": [
        "本案例新增的是数据内容与总线参与者合同，与既有采样时刻、DMA 缓冲、FIFO 事务边界问题不同。先分清失败发生在地址阶段、载荷阶段还是终止阶段，再讨论吞吐、截止时间和样本身份；一个成功的 DMA 回调并不证明外部器件都遵守了预期参与关系。",
        "原创诊断矩阵建议同时变更一个条件：载荷是否命中、ADXL355 地址选择、SDA 是否共享、预期接收方本应 ACK 还是 NACK。保持其他条件可比较，记录正常对照与失败对照。改变时钟后症状消失，只能作为线索，不能单凭这一点否定手册公开限制。",
        "不要过滤掉原始测量中的某两个字节来让通信“通过”。字节属于数值编码，删改会改变数据含义；除非整个发送接收协议明确支持并已验证一种编码，否则软件转义也不是传感器寄存器总线的通用补丁。"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。只用于经过电路审查、安全隔离且额定电压匹配的低压台架；接线变更前断电，不连接未知工业节点或带电改线。本页没有提供可直接部署的固件。"
      ],
      "bullets": [
        "冻结器件标识、ADXL355 手册版本、MCU/板卡/固件版本、实际地址与 SDA 连通图；分别记录协议约束、管脚模式与电气条件，未知项不以系列名称替代。",
        "用合适且不改变被测连接的逻辑分析工具被动捕获正常与异常事务；保留原始 SDA/SCL、地址/数据阶段、预期 ACK/NACK 及软件返回结果，不能只截图“扫描发现地址”。",
        "在经过审查的测试夹具中对比安全普通字节与命中字节，并对两种地址分别检查；断电完成独立 SDA 设计后重复同一矩阵。不要在不了解寄存器含义的真实传感器上任意写遍 256 个值。",
        "验收必须覆盖其他器件的最终读字节、明确拒收情形及异常后应用数据处理；逐笔核对来源、完整性与新鲜度。留存未通过项，不用重试成功率代替已消除根因的证明。"
      ]
    },
    {
      "label": "07 / TRANSFER THE LESSON",
      "title": "迁移练习：把“谁说的”补进验收条件",
      "paragraphs": [
        "练习一：预期接收方 NACK，旁路器件 ACK，线上会读到什么？再让预期接收方 ACK，解释为什么两种内部情形可以产生同一个观测。若证据不能区分两者，就补充拓扑与对照实验，不将解码器的 ACK 标签当作身份认证。",
        "练习二：把合成载荷里的 0x3A 改成 0x39，模型风险标记消失；再改成另一地址配置的 0xA6，重新检查。写清配置和数据共同决定结果，但模型不能预测真实设备是否会恢复、损坏哪一字节或丢失哪个样本。",
        "回到安全调试课程，把“预期现象 → 可观察证据 → 对照条件 → 仍未证明什么”写成四列；回到 ADC 课程，区分模拟建立误差与串行交付错误，不把重采样或数字滤波当成修复总线的手段。",
        "ADI 与 NXP 原文保留各自版权；这里只链接原始文档，提供原创解释与合成逻辑检查，不转载厂商图表、驱动或电路文件。未下载、编译、执行或烧录候选项目代码，未做本站或独立第三方实物复现；不是产品安全或协议合规认证。新材料保持待学习，旧课程与手动进度不变。"
      ]
    }
  ]
});
window.SensorCaseOverviews["adi-adxl355-shared-sda-ack"] = {
  "problem": "两个传感器地址不同，但其中一只仍可能回应另一只的数据字节，让共享总线的应答失去预期含义。",
  "method": "把地址阶段、数据内容、应答来源与连接拓扑拆开，对照普通字节和风险字节，再审查独立数据线方案。",
  "boundary": "依据厂商公开限制与原创逻辑反例，未板测；不提供未经核对的热切脚、通用驱动或电路修复保证。",
  "takeaway": "收到应答不等于目标器件正确收到了数据；总线兼容性需要检查参与者，而不只是地址。"
};

// Original ADS1115 configuration-generation case; all twenty prior cases retained unchanged.
window.SensorCases.push({
  "id": "ti-ads1115-config-generation",
  "maker": "TI",
  "title": "配置写成功，为什么下一笔仍是旧通道？",
  "subtitle": "ADS1115 · 连续转换 / 配置代际 / 结果归属",
  "question": "把采样率调快后，只等一个新周期就读数，真的读到了新配置吗？",
  "summary": "用旧转换与新转换的交接反例，分清命令已送达、转换已完成与结果可归属。",
  "published": "2009-05",
  "revision": "TI SBAS444E 电气正文，2024-12 修订；包装附录日期不作为转换机制版本。",
  "verified": "2026-11-04",
  "evidence": "厂商数据手册机制 + 本站原创配置代际模型；非台架性能报告",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "error",
    "debug"
  ],
  "timingRelated": true,
  "conditions": "限定普通 ADS1115（非 ADS1115L、非 ADS1115-Q1），SBAS444E 版本；连续模式中一次配置变更，无第二次覆盖写。未选 MCU、驱动或电路，未连接硬件。模型使用已知、严格排序的转换边界，忽略总线耗时、模拟建立和时钟误差，不是器件模拟或可部署驱动。",
  "sources": [
    {
      "id": "ds",
      "label": "TI ADS111x SBAS444E · §5.5 p.5；§7.4.2 p.18",
      "url": "https://www.ti.com/lit/ds/symlink/ads1115.pdf",
      "date": "首发 2009-05；电气正文修订 2024-12；资料核验 2026-11-04"
    }
  ],
  "blocks": [
    {
      "label": "01 / TWO CONFIGURATIONS AT ONCE",
      "title": "寄存器已改，不等于在途转换改了",
      "paragraphs": [
        "手册 §7.4.2.2：连续转换中写入新设置，在途转换仍按旧设置完成，之后才启动采用新设置的转换。§5.5 给出的数据率变化为 ±10%。",
        "本站分析：把“当前想要的配置”直接贴到下一笔数值上，会把合法旧结果误标成新结果。它可能幅度合理、通信也成功，因此不能只靠数值越界检测。这里检查配置生效边界，不重复模拟节点建立时间或多 ADC 同步问题。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "02 / AN ORIGINAL TIMELINE",
      "title": "新周期很短，旧转换却还没结束",
      "formula": "原创名义模型：旧速率 128 SPS，新速率 860 SPS\nT旧 = 1000 / 128 = 7.8125 ms\nT新 = 1000 / 860 ≈ 1.1628 ms\n变更发生于旧转换开始后 0.5 ms\n旧结果：t = 7.8125 ms；首个新结果：t ≈ 8.9753 ms",
      "paragraphs": [
        "假定 t=0 已开始旧配置 A 的转换，在 t=0.5 ms 瞬时提交配置 B。旧转换不被取消。若从写配置后只等一个新周期，读取时刻约为 1.6628 ms，连这次旧转换都尚未完成；模型里读到的是更早保留的 A 结果。",
        "即使在 t=8 ms 读取，模型给出的仍是刚完成的 A 结果。到 t=9 ms 才可得到已完成的 B 结果。这些时刻仅检验给定名义时间轴，不是硬件等待常数、采样孔径或延迟保证。"
      ]
    },
    {
      "label": "03 / A BUDGET IS NOT A DRIVER",
      "title": "把旧周期加回来，也还不是可直接部署的延时",
      "formula": "仅此模型：写入到首个新结果 = T旧 − 写入相位 + T新\n0.5 ms 相位：约 8.4753 ms\n若两种实际速率均为名义值的 90%，两个整周期之和约 9.9725 ms",
      "paragraphs": [
        "原创相位扫描让写入时刻从旧转换早期移向末尾，首个新结果的等待随之缩短。只用新周期的算法遗漏了在途旧转换，这个反例并不需要模拟噪声。",
        "9.9725 ms 只是在慢速假设下的周期和，不是完整系统上界。提交被器件接收的时刻、边界竞争、总线传输、调度、模拟源建立及错误恢复均未建模。若没有证据确定配置写入与转换边界的先后，就标记未知，不把恰好相等的时间戳强行排序。"
      ]
    },
    {
      "label": "04 / IDENTITY BEFORE PUBLICATION",
      "title": "读到了两次，不等于完成了两次",
      "paragraphs": [
        "本站建议的应用验收合同：分别记录 requested_config、已证明生效的配置代际、转换完成证据与读取时间；这些是应用元数据，不是声称 ADS1115 会在数值中携带通道标签。",
        "模型把多次读同一结果保留为同一个 completion_id。在旧结果更新前连续读两次，不能因为“已经丢弃第一读”就把第二读当新数据。只有可确认属于 B 且尚未交付的完成事件才能进入 B 数据集。",
        "若提交结果不确定、完成事件缺失、顺序无法确定或再次请求配置，暂停该代际的交付并重新建立边界证据。本文不规定通用丢弃次数、不把总线 ACK 当转换完成，也不声称只读回配置就证明了结果来源。"
      ]
    },
    {
      "label": "05 / SINGLE SHOT IS A DIFFERENT CONTRACT",
      "title": "改用单次模式，也要检查忙状态",
      "paragraphs": [
        "手册 §7.4.2.1：单次模式在转换进行时写 OS=1 无效；从关断状态唤醒约 25 μs 后开始转换。这个约数不是最大启动时间。",
        "本站设计建议：若选用单次调度，先明确设备确已空闲，再把配置请求、被接受的启动与对应完成串成同一条记录。忙时重复发启动不能充当任务队列。模式选择需要另行权衡吞吐和可观测性，不能直接把连续模式模型当作单次驱动。"
      ],
      "sourceIds": [
        "ds"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。仅限经过电路审查、安全隔离且额定电压匹配的低压台架；接线变更前断电。本页无接线处方或可烧录固件。"
      ],
      "bullets": [
        "冻结完整料号、手册版本、供电与输入范围、控制器和固件版本；记录旧/新配置、真实提交边界与完整通信事务。",
        "选取安全且可区分的两种输入条件，对比早期/中期/末期配置写入；保留原始完成证据和读取记录，不只保存处理后的曲线。",
        "覆盖重复读取、漏掉一次完成、提交失败或结果不确定、再次配置及超时；未能证明归属的数据必须保留无效原因，不能静默拼进新数据集。",
        "分别验证模拟建立、数值换算、配置归属和时间预算；在器件规定条件下考察时钟与调度余量。任何待验证项都不以本页合成结果代替。"
      ]
    },
    {
      "label": "07 / TRANSFER THE CONTRACT",
      "title": "练习：先问结果属于哪一代，再问它是多少",
      "paragraphs": [
        "练习一：固定新速率，将旧速率改为 8 SPS。模型中旧周期变成 125 ms；说明为什么同一个“新周期等待”不能覆盖不同起点。再让旧/新速率相同但通道不同，解释时间间隔正确为何仍不能自动证明通道正确。",
        "练习二：在 t=1 ms 与 t=2 ms 两次读取同一个旧结果，再在 t=8 ms 读到另一个旧结果。按完成身份而非 API 调用次数记账，指出哪些记录应拒绝进入 B 数据集。",
        "TI 原文保留版权；这里只链接原始资料并提供原创解释和离线教学模型，不转载驱动、图表或电路。未下载、编译、执行或烧录候选项目代码，没有本站或独立第三方实物复现。新材料保持待学习，旧内容和手动进度不变。"
      ]
    }
  ]
});
window.SensorCaseOverviews["ti-ads1115-config-generation"] = {
  "problem": "配置命令已经写入，但正在完成的仍可能是旧配置，下一次读取因此会被贴错通道或量程标签。",
  "method": "把配置提交、在途旧转换、新转换完成和重复读取画在同一时间轴，按已证明的代际接收数据。",
  "boundary": "依据公开手册与原创名义事件模型，未板测；时钟、总线和边界竞争仍需验证，不提供万能延时。",
  "takeaway": "配置写入成功与新配置结果已经可读不是同一件事；读数次数也不是转换完成次数。"
};

// Original RP2040 fractional-pacing case; all twenty-one prior cases retained unchanged.
window.SensorCases.push({
  "id": "rpi-rp2040-fractional-pacing",
  "maker": "Raspberry Pi",
  "title": "平均采样率对了，每个间隔也一样吗？",
  "subtitle": "RP2040 · ADC 分数节拍 / DMA 搬运 / 时间轴误差",
  "question": "DMA 收满一块数据，能否直接证明这些点严格等间隔？",
  "summary": "从官方采集示例出发，把分频量化、逐间隔变化与结果搬运拆成三个不同问题。",
  "published": "2025-02-20",
  "publicationLabel": "所读版本发布",
  "revision": "RP2040 Datasheet build 3184e62-clean（2025-02-20）；Pico SDK 2.3.1 与示例分别冻结到官方仓库提交。",
  "verified": "2026-11-05",
  "evidence": "厂商手册机制 + 固定官方源码静态核读 + 原创整数时间模型；非板测报告",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": ["adc", "error", "debug"],
  "timingRelated": true,
  "conditions": "限定 RP2040，非 RP2350；单 ADC、单输入、48 MHz 理想 clk_adc、稳定连续转换、无丢样。SDK 版本为 2.3.1，commit 079c6f39023649b154152db30f1d781e884879bc；示例 commit 0d62f75bafc2c8120d3276c3343d1a9195e909e9。两者分别只读核验，未证明配套构建。44.1 kSPS 是本站另设的教学目标，不是官方示例原参数。无实物、板卡引脚验收、固件构建或可部署驱动。",
  "sources": [
    {"id":"ds", "label":"RP2040 Datasheet · §§4.9.2.2、4.9.2.5 / Table 572，pp.559–561、566", "url":"https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf", "date":"所读 build-date 2025-02-20；build-version 3184e62-clean；不是本次新发布"},
    {"id":"example", "label":"官方 pico-examples · adc/dma_capture/dma_capture.c · 固定提交", "url":"https://github.com/raspberrypi/pico-examples/blob/0d62f75bafc2c8120d3276c3343d1a9195e909e9/adc/dma_capture/dma_capture.c", "date":"仓库提交 2026-09-03；示例文件版权 2021，不将提交日期当首发日期"},
    {"id":"api", "label":"Pico SDK · hardware_adc/adc.h · adc_set_clkdiv 与 adc_fifo_drain", "url":"https://github.com/raspberrypi/pico-sdk/blob/079c6f39023649b154152db30f1d781e884879bc/src/rp2_common/hardware_adc/include/hardware/adc.h", "date":"固定 SDK 仓库提交 2026-09-04；只读函数与注释，未执行"},
    {"id":"regs", "label":"Pico SDK · RP2040 ADC 寄存器定义 · DIV.INT / FRAC", "url":"https://github.com/raspberrypi/pico-sdk/blob/079c6f39023649b154152db30f1d781e884879bc/src/rp2040/hardware_regs/include/hardware/regs/adc.h", "date":"固定 SDK 仓库提交 2026-09-04；RP2040 专属路径"},
    {"id":"dreq", "label":"Pico SDK · RP2040 DREQ 表 · DREQ_ADC=36", "url":"https://github.com/raspberrypi/pico-sdk/blob/079c6f39023649b154152db30f1d781e884879bc/src/rp2040/hardware_regs/include/hardware/regs/dreq.h", "date":"固定 SDK 仓库提交 2026-09-04；不是 RP2350 的映射表"},
    {"id":"platform", "label":"Pico SDK · RP2040 platform.h · 默认分频舍入选项", "url":"https://github.com/raspberrypi/pico-sdk/blob/079c6f39023649b154152db30f1d781e884879bc/src/rp2040/pico_platform/include/pico/platform.h", "date":"固定 SDK 仓库提交 2026-09-04；默认 PICO_CLKDIV_ROUND_NEAREST=1"},
    {"id":"version", "label":"Pico SDK · pico_sdk_version.cmake · 2.3.1", "url":"https://github.com/raspberrypi/pico-sdk/blob/079c6f39023649b154152db30f1d781e884879bc/pico_sdk_version.cmake", "date":"固定 SDK 仓库提交 2026-09-04；版本文件为 2.3.1"}
  ],
  "blocks": [
    {
      "label":"01 / THE TIMER IS INSIDE THE ADC",
      "title":"设置的是启动节拍，不是让 DMA 代替采样",
      "paragraphs":[
        "手册 §4.9.2.2 与 Table 572：ADC 的节拍器有 16 位整数和 8 位小数部分。非零分数通过一阶 delta-sigma 改变相邻间隔；稳态平均周期是 1+INT+FRAC/256，单个间隔为 INT+1 或 INT+2 个 clk_adc 周期。写 DIV 字段会重置分频器。这里的 delta-sigma 是数字节拍机制，不是把 SAR ADC 变成了 ΔΣ 转换器。",
        "48 MHz 下完成一次转换需要 96 个 ADC 时钟。本文只分析远大于 96 周期的稳定节拍，不把忙期间忽略触发的机制简化为任意分频值都能使用同一公式；启动、重写 DIV、停机后首个样本的相位不在模型内。"
      ],
      "sourceIds":["ds","regs"]
    },
    {
      "label":"02 / A VERIFIED DATA ROUTE",
      "title":"官方示例证明了哪一条数据通路？",
      "paragraphs":[
        "所读官方 dma_capture 示例选 ADC 输入 0 / GPIO26，DIV=0 全速采集，目标是 1000 个字节。它启用 FIFO 与 DREQ，阈值为 1，结果右移到 8 位；DMA 固定读 ADC FIFO、递增写缓冲区，先启动 DMA 再启动 ADC。样例同时有 PIO 电阻 DAC 演示，本页未复制或运行该部分，也不提供接线建议。",
        "精确映射仅限 RP2040：ADC FIFO → DREQ_ADC=36 → 所分配 DMA 通道。此信号控制结果搬运，不能凭它推导 ADC 启动时间。示例没有固定 DMA 通道号，也没有 STM32 TIM/TRGO、NXP XBAR 或外部定时器到 ADC 的触发映射。",
        "示例完成后清除连续采集并调用 adc_fifo_drain；所读 SDK 函数先等待 READY，再清掉残留 FIFO。其 8 位读取看不到 bit 15 的逐样本错误标志，示例明确关闭该标志。它是采集教学起点，不是无丢样、12 位精度或时间戳完整性的证明。"
      ],
      "sourceIds":["example","api","dreq"]
    },
    {
      "label":"03 / A RATE IS AN AVERAGE",
      "title":"44.1 kSPS 的两种间隔，算出来并不相等",
      "formula":"原创目标：f_adc = 48,000,000 Hz，f目标 = 44,100 SPS\n理想 div = f_adc/f目标 − 1 ≈ 1087.435374\n最近 1/256 格点：INT=1087，FRAC=111\n平均周期 = 1088.43359375 cycles\nf平均 ≈ 44100.072136 SPS，约 +1.635745 ppm\n短间隔 = 1088 cycles ≈ 22.666667 μs\n长间隔 = 1089 cycles = 22.687500 μs",
      "paragraphs":[
        "这是对明示理想时钟和已编码字段的原创算术，不是器件频率测量。相邻间隔相差一个 ADC 时钟，即约 20.833333 ns；即使平均速率非常接近目标，每次采样也不落在完全均匀的网格上。实际时钟误差仍会按比例改变这些数值。",
        "所读 SDK 2.3.1 的 adc_set_clkdiv 接收的是 div，不是含额外 1 的完整周期；默认最近舍入由 RP2040 platform.h 与 ADC 专用开关共同决定，构建配置可以覆盖它。本文冻结 INT/FRAC 后再做整数模型，不声称对任意编译器、浮点输入和配置都重现了 API 行为。",
        "反例：漏减 1 而把 48 MHz/44.1 kHz 当 div，最近格点会给出约 44059.592320 SPS，约 −916.273930 ppm；只用整数周期 1088 则约为 44117.647059 SPS，约 +400.160064 ppm。平均速率误差与逐间隔变化需要分别验收。"
      ],
      "sourceIds":["api","platform","version"]
    },
    {
      "label":"04 / A BOUNDED ORIGINAL MODEL",
      "title":"把时间误差画出来，而不是编造一条芯片波形",
      "formula":"独立教学模型：a₀=0，n=1087，F=111\ncₖ = n+1+floor((aₖ₋₁+F)/256)\naₖ = (aₖ₋₁+F) mod 256\ntₖ = Σcᵢ / f_adc（t₀=0）\n256 个间隔：145 短 + 111 长，共 278639 cycles\n持续约 5804.979167 μs；这是 257 个启动点之间的跨度",
      "paragraphs":[
        "原创累加器只是一个满足平均分频约束的离散模型，a₀=0 是人为选定的初相；不宣称这就是硅片重置后第一个长间隔的位置。改变模型初相会移动长短次序，但一个完整 256 间隔块的总和相同。测试逐项对比独立闭式计数，而不是运行厂商驱动。",
        "在这个模型里，累计时刻与同平均速率的均匀网格之差有界，不随时间无穷增长；它与偏离目标 44100 SPS 的长期速率偏差不是同一个量。不要把 N 个样本写成 N 个首尾间隔：首个到末个启动点只有 N−1 个间隔。",
        "这种确定性的间隔变化不能直接当成独立白噪声抖动，套一个随机抖动信噪比公式。本页不预测杂散幅度、FFT 性能、采样保持孔径、模拟误差、DMA 延迟或任意频率的硬件相位响应。"
      ]
    },
    {
      "label":"05 / TRANSPORT IS NOT A CLOCK",
      "title":"一块完整的内存，不会自动补齐采样时间证据",
      "paragraphs":[
        "本站验收建议：分别保存配置的时钟来源、DIV 字段与采集代际，再核对数据完整性。DMA 完成时间包含转换完成后的 FIFO、总线与调度影响；仅凭最后一次回调，既不能逐点恢复启动时间，也不能证明样本严格等间隔。",
        "模型可以计算名义节拍网格，真实系统仍要证明时钟、初相、无丢样以及配置未变。发生溢出、停启或改 DIV 后，不沿用旧时间轴硬拼下一块。本文没有设计连续 DMA 重装、FIFO 恢复或多通道同步驱动。",
        "若应用必须严格等间隔，先从实际时钟选择可表示的整数周期并评估速率误差，或另行审查支持所需触发的硬件方案；不能把 DREQ_ADC 换成 DMA 定时请求，就宣称改变了 ADC 的取样节拍。"
      ]
    },
    {
      "label":"06 / BENCH ACCEPTANCE",
      "title":"待执行的台架验收清单",
      "paragraphs":["以下为本站建议，尚未执行。仅限经过电路审查、安全隔离且输入额定值匹配的低压台架；变更接线前断电。本文没有可烧录固件，也没有完成硅版本勘误审查。"],
      "bullets":[
        "冻结完整器件与板卡版本、SDK/示例提交、构建舍入选项、clk_adc 来源及实测频率；读取并记录最终 INT/FRAC，不把用户输入的小数直接当硬件字段。",
        "分别对照整数与分数节拍，明确观测点测到的是启动、转换完成、FIFO 读取还是中断。GPIO 中断翻转含服务延迟，不能直接标成采样孔径抖动。",
        "记录完整性标志、首末记录、启动与停机边界；覆盖采集暂停、DIV 变更与 FIFO 异常，验证旧时间轴不会被无证据地续接。错误样本可见性需要重新审查传输位宽。",
        "分开验收平均速率、短长间隔、累计时间偏差与模拟测量质量；保留原始记录和未通过项，不用本页 ppm 算术、合成曲线或 DMA 完成次数代替实测。"
      ]
    },
    {
      "label":"07 / TRANSFER THE LESSON",
      "title":"练习：要的是平均准确，还是每次都准时？",
      "paragraphs":[
        "练习一：把教学目标改为 48 kSPS。理想 48 MHz 时钟对应 INT=999、FRAC=0；模型的间隔全为 1000 cycles。再加入一个假设时钟偏差，说明没有分数间隔变化也不代表绝对采样率准确。",
        "练习二：保持 INT=1087，将 FRAC 改为 128；独立模型在两个相邻整数间隔间变化，完整两间隔块的和固定。改变初相只移动排列；比较同平均网格、目标网格和 DMA 接收时间，分别写明能够证明什么。",
        "资料与代码保留 Raspberry Pi 的版权。手册声明 CC BY-ND 4.0，所读示例与 SDK 文件为 BSD-3-Clause；本页只链接原文，提供原创解释和合成整数检查，不重制手册图表、不分发厂商代码。未编译、执行或烧录候选代码，没有本站或独立第三方实物复现；新材料保持待学习，旧课程与手动进度不变。"
      ]
    }
  ]
});
window.SensorCaseOverviews["rpi-rp2040-fractional-pacing"] = {
  "problem":"采样率的平均值很接近目标，但相邻样本仍可能有不同间隔，完整的 DMA 缓冲也证明不了严格等间隔。",
  "method":"先核对实际分频字段与结果搬运路径，再分别计算平均速率、短长间隔和累计时间偏差。",
  "boundary":"依据官方资料与原创离散模型，尚未板测；不预测硬件初相、采样孔径、杂散或 DMA 延迟。",
  "takeaway":"采样节拍和数据搬运是两条证据链；平均准确、每次准时与完整收到数据，需要分开验证。"
};

window.SensorCases.push({
  "id": "ti-f28004x-ppb-delay",
  "maker": "TI",
  "title": "ADC 排队：触发准时，采样未必准时",
  "subtitle": "F28004x · PPB / DLYSTAMP / 12 位回绕 / 静区验收",
  "question": "定时器每次都准点发出请求，为什么采样仍会撞上开关噪声？",
  "summary": "把触发到采样窗开始的等待单独量出来，并证明时间戳没有回绕歧义。",
  "published": "2015-11",
  "revision": "SPRUI33H · 2024-06 修订；仅审查 F28004x PPB 延迟捕获",
  "verified": "2026-11-07",
  "evidence": "厂商技术参考手册 + 原创有界时间证据模型",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "error",
    "debug"
  ],
  "conditions": "器件系列固定为 TMS320F28004x，文档版本 SPRUI33H。只讨论一个 PPB 关联一个 SOC、有效硬件触发及对应采样窗开始；没有板卡、固件或硅版本实测。100 MHz、触发时刻、窗口宽度和静区均为原创教学假设，不是完整器件配置。",
  "sources": [
    {
      "id": "trm",
      "label": "TI SPRUI33H · §13.8.4 p.1554 / Table 13-76 p.1683",
      "url": "https://www.ti.com/lit/ug/sprui33h/sprui33h.pdf",
      "date": "首发 2015-11；Rev. H 2024-06，已读取官方完整 PDF"
    }
  ],
  "blocks": [
    {
      "label": "01 / REQUEST IS NOT ACQUISITION",
      "title": "定时器只约定了请求，不替 ADC 清空队列",
      "paragraphs": [
        "厂商说明：同一个 ADC 上的异步控制环可能同时请求转换，使其中一个样本等待。§13.8 的 PPB 功能包含触发至采样开始的延迟捕获；它补充的是调度证据，不会自动消除竞争。",
        "本站去重：既有 F280015x burst 案例讨论轮转通道样本年龄，RP2040 案例讨论分数节拍。本例固定 F28004x，关注已经触发的 SOC 实际等了多久，以及一个很小的寄存器读数为何仍可能不可信。不能跨系列搬用寄存器或时序。"
      ],
      "sourceIds": [
        "trm"
      ]
    },
    {
      "label": "02 / NAME THE TWO EDGES",
      "title": "DLYSTAMP 的终点是采样窗开始",
      "paragraphs": [
        "§13.8.4 先概述为触发到开始转换的 SYSCLK 周期数，紧接着明确硬件过程：12 位 ADCCOUNTER.FREECOUNT 自由运行；关联 SOC 的触发到来时保存 REQSTAMP，实际采样窗开始时做计数差并锁存 DLYSTAMP。Table 13-76 再次明确终点为 actual start of the sample。本文按这个具体端点解释，不把概述中的 converting 当成转换完成。",
        "因此 DLYSTAMP 不是采样保持孔径、采样窗结束、结果锁存、DMA 完成或 ISR 服务时间。它也不是带绝对时刻的连续日志。要把读数和电压码成对使用，软件还需证明同一 SOC、同一配置代际及同一次采样；本页不提供原子读取或 DMA 配置方案。"
      ],
      "sourceIds": [
        "trm"
      ]
    },
    {
      "label": "03 / MODULAR EVIDENCE",
      "title": "小读数可能是短等待，也可能是计数绕了一圈",
      "formula": "原创计数模型：M=4096\nr=T mod M，s=(T+d) mod M\nD=(s−r+M) mod M = d mod M\nT=4090，d=28：r=4090，s=22，D=28\nd=4124 时同样得到 D=28；d=4096 得到 D=0",
      "paragraphs": [
        "手册规定 12 位计数器，并警告触发至采样开始超过 4096 SYSCLK 周期时会得到错误的 DLYSTAMP。模型揭示更保守的唯一性条件：必须从独立调度分析证明 0≤d<4096；恰好一整圈也不能仅由差值区分。计数值跨过零不一定有问题，失去完整圈数才是歧义。",
        "这不是饱和计数器；不能把接近零当成必然没有排队。假设 SYSCLK=100 MHz，一圈是 40.96 μs，28 周期是 280 ns。证明上界必须靠最坏调度与完整性证据，不能反过来拿小 DLYSTAMP 证明等待一定短。"
      ],
      "sourceIds": [
        "trm"
      ]
    },
    {
      "label": "04 / A QUIET WINDOW CONTRACT",
      "title": "等待量可测，还要检查整个采样窗",
      "formula": "独立教学时间轴，单位均为 SYSCLK cycles：\n触发 T=100，假设采样窗宽 W=20\n允许采样窗完整落在闭区间 [108,140]\nd=8 → [108,128]，满足教学判据\nd=28 → [128,148]，越过右边界 8 cycles\n100 MHz 下分别等待 80 ns / 280 ns",
      "paragraphs": [
        "原创判据是 [T+d,T+d+W] 完整包含于指定静区，边界相等按模型约定接受。这里 W=20 是给定量，不是自动生成 ACQPS 或证明模拟输入已经建立；真实允许区间、孔径与裕量必须由具体芯片资料和电路确定。",
        "测试还给出相同采样起点、不同窗口宽度的反例：d=8 且 W=40 时终点为 148，仍不满足。仅比较 DLYSTAMP 是否小于某个阈值会漏掉采样窗宽度。此模型不模拟 ADC 优先级、总线仲裁、硅片延迟或噪声性能。"
      ]
    },
    {
      "label": "05 / REJECT UNSUPPORTED EVIDENCE",
      "title": "软件触发与配对不明，不能套同一个公式",
      "paragraphs": [
        "手册明确：关联 SOC 由软件触发时，sample delay capture 不工作。但若软件触发的是另一个 SOC，导致 PPB 所关联的硬件触发 SOC 延后，后者仍可正确记录延迟。不能简化为系统里出现软件触发就全部无效，也不能用强制触发关联 SOC 来验证这一捕获链。",
        "本站保守验收模型要求硬件触发、当前记录与期望的 SOC/配置代际一致、记录完整性已获独立确认、最坏等待上界小于 4096，且 DLYSTAMP 不超过该上界；任何证据缺失都拒绝给出确定的采样时刻。代际号和完整性标记是应用层教学输入，不是芯片自动附带的字段。",
        "读取一个仍保留的数值不证明发生了新采样；下一次关联采样会更新 DLYSTAMP。本页不建模未完成请求重触发、丢请求、复位、时钟切换或读取竞态，也不提出外推校正算法。厂商提到外推可能减小误差，不意味着未知信号可以无损还原。"
      ],
      "sourceIds": [
        "trm"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。只限经过电路审查、安全隔离且额定值匹配的低压台架；变更接线前断电。没有完成特定硅版本的勘误审查，没有可烧录固件。"
      ],
      "bullets": [
        "冻结具体 F28004x 器件、硅版本、SYSCLK、SOC/PPB 关联、真实触发来源、采样窗宽与其他请求负载；另查对应数据手册、勘误及触发路由。",
        "分别标明观测的是触发、采样窗开始还是中断翻转；确认关联 SOC 使用硬件触发。对不同 SOC 的软件竞争单独测试，避免把不支持的路径当正常样本。",
        "以最坏调度证明等待小于一圈，覆盖跨零、上界和负载变化；独立记录异常和配置代际，确认电压码与延迟读数成对。任何来源不明或覆盖丢失都不拼接旧时间轴。",
        "同时验收完整采样窗是否落在模拟静区、输入建立是否满足、数据是否完整；保留未通过结果。不能用本页合成检查数、GPIO ISR 波形或小 DLYSTAMP 代替硬件证据。"
      ]
    },
    {
      "label": "07 / TRANSFER THE LESSON",
      "title": "练习：数值没变，证据可能已经变了",
      "paragraphs": [
        "练习一：保持 D=28，把已证明的等待上界从 100 改为 5000。读数一样，但不再能唯一恢复等待；模型必须拒绝，而不是输出 280 ns。再把触发计数移到 4090，说明正常跨零与多圈歧义的区别。",
        "练习二：让软件触发另一个 SOC，关联 SOC 仍是硬件触发，解释为何不应一律拒绝；随后改为软件直接触发关联 SOC，即使寄存器碰巧仍为 28，也不能沿用上一条证据。",
        "资料版权归 Texas Instruments；本页仅链接官方 PDF，提供原创解释、合成整数算术和回归，不复制厂商代码或图表。未下载运行候选项目代码，未操作硬件，没有本站或独立第三方实物复现。新材料保持待学习，所有旧案例、课程和手动进度不变。"
      ]
    }
  ]
});
window.SensorCaseOverviews["ti-f28004x-ppb-delay"] = {
  "problem": "触发源每次都准时，ADC 却可能先忙别的请求；很小的延迟读数也可能藏着计数回绕。",
  "method": "核对触发至采样窗开始的两个端点，证明等待上界和数据配对，再检查整个采样窗是否落在静区。",
  "boundary": "依据 F28004x 官方手册与原创有界模型，尚未板测；不模拟孔径、优先级、读取竞态或自动校正。",
  "takeaway": "时间戳先要证明含义、有效范围和所属样本；只有一个数值，还不能证明采样准时。"
};

// Original ADS131M04 response-type case; all twenty-three prior cases retained unchanged.
window.SensorCases.push({
  "id": "ti-ads131m04-response-identity",
  "maker": "TI",
  "title": "CRC 通过，为什么读到的却不是 ADC 数据？",
  "subtitle": "ADS131M04 · RREG 流水 / 同长度异类型帧 / 输出 CRC",
  "question": "一帧恰好 18 字节，CRC 也正确，就能把中间四个字交给测量算法吗？",
  "summary": "按前一帧命令决定本帧含义，避免把合法寄存器响应误当四路采样。",
  "published": "2019-03",
  "revision": "ADS131M04 · SBAS890D（2021-05）；CRC 背景 SBAA106A（2021-08）",
  "verified": "2026-11-08",
  "evidence": "厂商数据手册与应用笔记 + 本站原创字节与类型反例；非板卡通信实测",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": ["adc", "error", "debug"],
  "conditions": "限定普通 ADS131M04，非 ADS131M04-Q1、ADS131A04 或其他通道数器件。版本 SBAS890D；已知稳定通信、24-bit 字长、CCITT 输出 CRC，仅比较 NULL、单寄存器 RREG 与四寄存器 RREG。模型假设命令已正确接收、完整事务边界和前帧身份有独立证据；不模拟输入 CRC、WREG、复位或超时恢复。无指定 MCU、引脚、CLKIN、SCLK 或固件版本，不提供 DMA 路由、可烧录驱动或时钟配置。",
  "sources": [
    {"id":"ds","label":"TI SBAS890D · §8.3.12 p.28；§§8.5.1.7–8.5.1.10.7 pp.36–42；Table 8-12 p.45；MODE p.50","url":"https://www.ti.com/lit/ds/symlink/ads131m04.pdf","date":"电气正文首发 2019-03，Rev. D 2021-05；核验 2026-11-08。后续封装附录日期不当成协议修订。"},
    {"id":"crc","label":"TI SBAA106A · §3 pp.7–10：CRC 余数、位序与错误检测边界","url":"https://www.ti.com/lit/pdf/sbaa106","date":"首发 2020-06；Rev. A 2021-08。仅阅读原理，不复制或运行文中示例代码。"}
  ],
  "blocks": [
    {
      "label":"01 / THE PREVIOUS COMMAND MATTERS",
      "title":"当前发送 NULL，不代表当前收到的是普通数据帧",
      "paragraphs":[
        "手册规定：响应属于前一帧命令。NULL 的响应是 STATUS；单寄存器 RREG 把该寄存器放在响应字，后面仍有 ADC 数据；多寄存器 RREG 的下一帧则输出确认字与寄存器内容，不输出 ADC 数据。",
        "原创时间线：假设前史已确认是 NULL，事务 k 发送四寄存器 RREG，同时仍收到普通 ADC 帧；k+1 发送 NULL，却收到寄存器帧；k+2 再发送 NULL，才回到普通帧结构。只按本次发送的命令选择解析器，恰好会把 k 与 k+1 分错。这里的 k 是通信事务序号，不是转换完成序号。"
      ],
      "sourceIds":["ds"]
    },
    {
      "label":"02 / SAME LENGTH, DIFFERENT MEANING",
      "title":"四个寄存器，刚好占掉四个通道的位置",
      "formula":"24-bit 字长：一个串行字 = 3 bytes\n普通帧：STATUS + CH0 + CH1 + CH2 + CH3 + CRC = 18 bytes\n四寄存器响应：ACK + REG[09h] + REG[0Ah] + REG[0Bh] + REG[0Ch] + CRC = 18 bytes\n两者均为 144 个串行位；相同长度不是相同数据类型",
      "paragraphs":[
        "核对映射：MODE 地址 02h，WLENGTH[1:0] 位于 [9:8]，01b 表示 24-bit。命令、确认、寄存器与 CRC 的有效部分为 16 bit，在此字长中高位对齐、低 8 bit 补零。Table 8-11 的 RREG 编码为 101a aaaa annn nnnn，数量字段是寄存器数减一；多读确认的前缀为 111。",
        "原创编码练习：a=09h、数量=4，命令为 A483h，响应确认 E483h。读取的四个已定义地址分别是 CH0_CFG、CH0_OCAL_MSB、CH0_OCAL_LSB、CH0_GCAL_MSB；没有跨过保留地址 05h，也没有把其他型号的寄存器表搬来。选用复位值作为合成内容 [0000h,0000h,0000h,8000h]，串行字为 [000000h,000000h,000000h,800000h]。这是假设内容，不是上电抓包或立即有效的启动测量。",
        "若错误地将这四字当作 24-bit 有符号 ADC 码，就得到 [0,0,0,−8388608]。最后一项像负满量程，但其实来自增益校准寄存器。滤波、限幅或重标定都无法把寄存器内容变回未收到的通道样本。"
      ],
      "sourceIds":["ds"]
    },
    {
      "label":"03 / CRC CHECKS THE BYTES",
      "title":"完整传输的错误类型，不需要一次比特翻转",
      "paragraphs":[
        "本例固定 CRC_TYPE=0（CCITT），16-bit 多项式 1021h、初值 FFFFh；输出 CRC 始终存在。独立测试采用 MSB-first、RefIn=RefOut=false、XorOut=0000h，按线上顺序对前五个 24-bit 字的 15 字节计算 CRC，保留每个字的填充字节，再将余数高位对齐放进第六字。CRC 字自身及其低 8 bit 填充不参与这 15 字节计算；填充须另检查为零。不是把五个数转换成主机 32-bit 整数后对内存整块计算。",
        "本站分别合成一帧普通数据和一帧 E483h 寄存器响应，各自计算 CRC。寄存器帧载荷 E4 83 00 00 00 00 00 00 00 00 00 00 80 00 00 的余数为 D7F9h，末字为 D7 F9 00；用逐位递推和独立多项式长除法交叉验证。两帧均为 18 字节且各自校验通过；一个仅检查长度与 CRC 的消费者会接收两者。这个反例没有依赖 CRC 碰撞、噪声或器件故障，错误发生在主机把已收到的合法类型贴错标签。",
        "SBAA106A 提醒 CRC 检测能力与多项式、长度和位序有关。通过不能保证绝无误码，更不能证明数值的新鲜度、物理来源或连续性，也不构成来源身份认证。本页的逐位翻转测试只验证指定合成帧的单比特反例，不给出器件误码率或功能安全结论。"
      ],
      "sourceIds":["ds","crc"]
    },
    {
      "label":"04 / TYPE BEFORE DELIVERY",
      "title":"把响应类型写进交付合同，而不是塞进采样数组",
      "paragraphs":[
        "原创受限模型先要求事务完整、字长与 CRC 约定明确，再查已证实的前帧命令。期待四寄存器响应时，核对 E483h 及寄存器字的填充位，交给配置读取结果；期待单寄存器响应时，第一字归寄存器，后四字归 ADC；期待 NULL 时，第一字归 STATUS。即使都有六个字，也不共享一个无类型的 channel[4] 接口。",
        "模型中的 previous、epoch、事务完整性和独立数据有效性证据都是主机或测试预言机输入，不是 ADC 自动携带的序号。模型不会凭 CRC 自己推断一条丢失的命令，也不会自动发现一份被错误标成可信的台账。上层仍需单独处理 STATUS 各状态位、配置一致性、样本新鲜度与缺测。",
        "前帧未知、事务是否完成不明或字长变更时，模型拒绝给出 ADC 身份。恢复需重新证明命令链与数据边界；本页不以“再发一个 NULL”作为通用恢复处方。输入 CRC 出错、WREG 改配置、SPI timeout、复位和半帧均在此模型之外。"
      ]
    },
    {
      "label":"05 / A RESPONSE IS NOT A CONVERSION",
      "title":"回到普通帧结构，也不等于恢复了连续采样",
      "paragraphs":[
        "本站建议将寄存器事务显式留在通信记录里，不把它压缩成 ADC 序列中的四个假样本。正常帧重新出现后，再用独立的就绪、配置和有效性证据决定是否能进入测量窗口；不能只凭事务 k+2 的位置，声称恰好漏了一个转换，或已经恢复等间隔数据。",
        "ADS131M04 是四路同时采样架构，SPI 逐字传输不等于四路顺序转换。本例不计算采样孔径、数字滤波群延迟或连续输出速率；它与已有“同时采样之后的时间戳”案例互补。144 位只说明本例两种帧的线长，不是采样周期；没有 SCLK、片选间隔和服务延迟就不换算传输时间。",
        "稳态类型判断也不是启动验收。上电、重新同步、模拟输入与参考建立、数字滤波建立，以及转换到总线读取的预算，应各自核对具体文档与电路。本文没有把总线就绪当模拟测量有效，没有给出未核实的等待常数或 MCU 触发 / DMA 映射。"
      ],
      "sourceIds":["ds"]
    },
    {
      "label":"06 / BENCH ACCEPTANCE",
      "title":"待执行的台架验收清单",
      "paragraphs":["以下为本站建议，尚未执行。仅用于电路已审查、安全隔离且额定值匹配的低压台架；接线变更前断电。没有固件或实物复现，不用于危险电压测量。"],
      "bullets":[
        "冻结具体器件、板卡、固件、字长、CRC 类型、输入 CRC 设置、实际时钟和通道配置；保留 CS、SCLK、DIN、DOUT 与 DRDY 的原始记录，不只保存驱动返回的四个整数。",
        "分别捕获 NULL、单寄存器 RREG、四寄存器 RREG 的前一帧与后一帧；逐字核对命令、确认、数量、填充位和 CRC 覆盖范围，确认多寄存器响应从未进入 ADC 数据集。",
        "在安全可控的测试中覆盖不完整事务、CRC 不匹配、前帧记录丢失和重新初始化；记录拒收原因，验证未知状态不会靠固定长度、重试次数或数值合理性被静默放行。",
        "寄存器检查前后另验采样连续性、启动建立、最坏服务期限与配置身份；保留缺测边界，不用软件事务计数代替器件转换计数，也不由本页合成结果推断板卡可靠性。"
      ]
    },
    {
      "label":"07 / TRANSFER THE CHECK",
      "title":"练习：同样的字节，先回答“它是什么”",
      "paragraphs":[
        "练习一：让 k+1 的前帧描述符丢失，但保留同一份完整、CRC 正确的寄存器响应。严格模型应报告未知，而不是根据当前发送 NULL 就交付四通道样本。再将期待地址改成 0Eh，说明为什么合法 CRC 也不能替代确认字与请求的匹配。",
        "练习二：改为只读 09h，一个寄存器响应字之后仍有四路 ADC 字。对照多寄存器读取，解释为什么“只要上帧是 RREG 就丢弃整帧”和“每帧都取中间四字”都过于粗糙；即使类型正确，数据有效性仍是下一道验收。",
        "资料版权归 TI；这里只链接官方文档，提供原创序列、整数与 CRC 多项式模型，不转载厂商代码、图表或数据集。未下载、编译、执行或烧录候选项目代码，未操作硬件，没有本站或独立第三方实物复现。新材料保持待学习，旧案例、课程、导航、设计和手动进度不变。"
      ]
    }
  ]
});
window.SensorCaseOverviews["ti-ads131m04-response-identity"] = {
  "problem":"一帧长度正确、CRC 也通过，里面仍可能是寄存器而非传感器数据；按当前命令解析还会错一帧。",
  "method":"按前一帧命令核对响应类型、确认字和字长，再分别交付配置结果与采样数据，未知事务不猜。",
  "boundary":"依据 ADS131M04 官方手册与原创字节模型，尚未板测；仅固定字长的已知命令链，不是完整驱动或恢复方案。",
  "takeaway":"CRC 验证收到的字节，不替你证明字节的类型、样本来源或时间连续性。"
};

// Original ADCC event-admission case; prior twenty-four cases retained unchanged.
window.SensorCases.push({
  "id": "adi-adcc-event-collision",
  "subtitle": "ADSP-CM408F · 事件竞争 / 时钟单位 / 双 ADC 配对",
  "question": "一个周期安排三路采样，怎样区分事件被丢弃、排队延迟和真正同时采样？",
  "timingRelated": true,
  "maker": "ADI",
  "title": "FIFO 还有空位，三次采样为什么仍会少两次？",
  "summary": "ADSP-CM408F：把事件匹配、排队、实际采样和帧交付分开验收。",
  "published": "2013-09",
  "revision": "AN-1267 Rev. A（2014-09）与 ADSP-CM40x HRM Rev. 0.3（2015-11）",
  "verified": "2026-11-09",
  "evidence": "厂商应用笔记与硬件手册 + 本站原创离散事件反例；未运行厂商代码或实测硬件",
  "reproduction": "未本站实物复现",
  "status": "待学习",
  "lessons": [
    "adc",
    "error",
    "debug"
  ],
  "conditions": "文档对象限定 ADSP-CM408F / ADSP-CM40x ADCC，版本固定为所列历史文档。两片内部 ADC、24 个可配置事件、两个 ADCC 定时器。本站只验证同接口同拍竞争与整数时间单位，不模拟完整三阶段流水线、TRU、模拟建立、DMA 或中断。未锁定板卡、工具链、芯片修订和当前勘误，不给出可直接烧录的触发接线或寄存器初始化。",
  "sources": [
    {
      "id": "an",
      "label": "ADI AN-1267 Rev. A · pp.6–9：事件、三阶段时序与预触发",
      "url": "https://www.analog.com/media/en/technical-documentation/app-notes/an-1267.pdf",
      "date": "初版2013-09；Rev. A 2014-09。以PDF修订历史为准，核验2026-11-09。"
    },
    {
      "id": "hrm",
      "label": "ADI ADSP-CM40x HRM Rev. 0.3 · §§26-16–19、26-26–29、26-32–37",
      "url": "https://www.analog.com/media/en/dsp-documentation/processor-manuals/ADSP-CM40x-hrm.pdf",
      "date": "Revision 0.3，2015-11，Part Number 82-100120-01。历史手册，不是当前芯片勘误认证。"
    }
  ],
  "blocks": [
    {
      "label": "01 / MATCH BEFORE QUEUE",
      "title": "先看入口能接几件事，再看队列能装几件事",
      "paragraphs": [
        "三个输入需要在一周期内读完，可以安排三个不同时间的事件；给同一 ADC 的三个事件写同一个时间，并不会让它们变成同时采样。HRM §§26-32–33 将条件写得更具体：同一 ADCC 定时器、相同 TIME、同一 ADC 接口的多个普通事件发生冲突时，只转发最高优先级事件，其余漏掉；即使 pending FIFO 仍有空间也不能补救。§26-18 的概述应结合这组具体条件阅读，不能扩大为所有同拍事件。",
        "同一定时器内，事件编号越小优先级越高。若两个普通事件分别属于 TMR0、TMR1 且同拍送往同一 ADC，手册明确先转发 TMR0，再转发 TMR1；后者在 FIFO 有空位时可以排队，不能一概判为丢失。转发后遇 ADC 忙可进入该接口的 8 深 FIFO，并置 ECOL；FIFO 已满则置 EMISS。已排队事件按顺序处理，不再按事件 ID 重排。"
      ],
      "sourceIds": [
        "hrm"
      ]
    },
    {
      "label": "02 / THREE EVENTS",
      "title": "一个简单反例：队列是空的，仍只收到一个事件",
      "formula": "合成输入：TMR0 → ADC0；事件 ID = 0、1、2\n相同匹配拍：TIME = 1600、1600、1600\n入口仲裁：0 获胜；1、2 漏掉；FIFO 空间不能救回它们\n改为三个不同拍：1600、1601、1602，只消除了同拍入口冲突",
      "paragraphs": [
        "本站原创模型把这一条入口规则单独拎出来测试：先按 ADC 接口、定时器与匹配拍分组，每组按事件 ID 选择胜者；不同定时器的胜者按 TMR0、TMR1 顺序转发，再接受忙状态与队列容量检查。它没有实现真实 ADC 的服务时间或流水线。用“把所有同拍事件都排进空 FIFO”的错误模型对照，能直接看到漏检。",
        "不同拍的三个事件仍可能排队，实际采样会晚于设定事件时间；若通道切换建立不足，拿到三个数字也不代表测量有效。本文的 1 SYSCLK 间隔仅用于逻辑反例，绝不是建议的模拟采样间隔、最大吞吐率或不丢样配置。"
      ],
      "sourceIds": [
        "hrm"
      ]
    },
    {
      "label": "03 / TWO CLOCKS",
      "title": "事件时间与 ADC 串行时钟，不能用同一把尺",
      "formula": "采用手册时间定义的教学换算：SYSCLK = 80 MHz → 12.5 ns/tick\nTIME = 1600 → 匹配偏移 20 μs\nACLK = 40 MHz → 25 ns/tick；误用它会算成 40 μs\n目标匹配20 / 50 / 80 μs → 1600 / 4000 / 6400 SYSCLK ticks",
      "paragraphs": [
        "HRM §§26-16–18 明确内部定时器按 SYSCLK 计数，事件 TIME 也是系统时钟单位；片选宽度、NCK、TCSCK、TCKCS 与 TCSCS 则按 ADC 时钟计。AN-1267 p.7 图8附近却把事件时间写成 ACLK 单位，两份官方材料存在文字差异。本站按更晚 HRM 做这组算术，并保留冲突，不声称已经获得厂商勘误确认或在芯片上验证。",
        "这组三相位是原创安排，不是某个产品的完整配置。要落实到板上，仍需查实际触发主从映射、时钟树、输入通道与模拟建立，先测到匹配和实际采样的关系；不要从本例推断 STM32 或其他系列的 ITR/TRGO 路由。"
      ],
      "sourceIds": [
        "hrm",
        "an"
      ]
    },
    {
      "label": "04 / SAMPLING AFTER CONTROL",
      "title": "450 ns 是哪一段，1350 ns 又是哪一段？",
      "formula": "AN-1267 示例参数：ACLK=40 MHz，TCSCK=1，NCK=8，TCKCS=0，TCSCS=9\n一个阶段周期：(1+8+0+9) / 40 MHz = 450 ns\n三阶段合计：3 × 450 ns = 1350 ns\n图示再加平均 DMA 50 ns 与 IRQ 200 ns → 1600 ns",
      "paragraphs": [
        "控制字先选择通道，随后采样/转换，最后读回数据。AN-1267 图10分别标出采样偏移450 ns、转换完成1350 ns、应用数据可用1600 ns；其表2却把 tCONV_ADC 列成450 ns。这里按图与三阶段公式区分含义，明确保留表格歧义，不把450 ns写成完整转换周期。",
        "HRM §§26-35–36另说明：空闲 ADC 从事件匹配到控制阶段片选断言有4–5 SYSCLK周期延迟；在80 MHz下为50–62.5 ns。DLYCNT更新于控制阶段起点，并非采样孔径时刻。忙状态、配对等待和TRU同步还会增加延迟。因此1600 ns图示不是端到端最坏期限，也不能直接当成测量时间戳。",
        "AN-1267建议用上一周期的PWM同步启动GP定时器，把下一次触发提前，以补偿固定偏移。必须给上一帧所有事件留足结束窗口，并验启动首帧与跨周期归属。本文不提供未核实的预触发寄存器方案；单纯减去450 ns也无法消除排队或不确定的同步延迟。"
      ],
      "sourceIds": [
        "an",
        "hrm"
      ]
    },
    {
      "label": "05 / PAIR AND FRAME",
      "title": "两路可以配对，第三路仍要安排自己的时刻",
      "paragraphs": [
        "HRM §§26-27–29要求同步对来自不同 ADC 接口、同一 ADCC 定时器、相同事件时间，并满足 SIMSAMP、共享片选等配置约束。它们会等待两个接口都准备好；一侧已有排队工作会拖后整对。相同 TIME 本身不保证实际同时，配对也没有抢占此前普通事件的特权。",
        "只有两个 ADC，三个物理输入不能凭三个事件号实现三路同一瞬间采样。可以研究“两路同步对 + 一路后续”的分时方案，但第三路的时间差、源阻抗和建立预算必须显式记录。本文没有给出配对位域的完整驱动或实际通道映射。",
        "DMA模式下，手册的帧结束还等待相关数据写入内存并收到响应。FISTAT帧完成状态需要确认清除，否则下一触发会被忽略并报触发溢出。事件匹配、采样、数据接收、DMA完成与允许下一帧应分别验收；未完成帧不能按预期长度补齐成一帧。"
      ],
      "sourceIds": [
        "hrm"
      ]
    },
    {
      "label": "06 / BENCH ACCEPTANCE",
      "title": "待执行的台架验收清单",
      "paragraphs": [
        "以下为本站建议，尚未执行。仅适用于电路已审查、低压且额定值匹配的受控台架，不操作电机功率级或危险电压。"
      ],
      "bullets": [
        "冻结具体芯片修订、板卡、手册/勘误、实际SYSCLK/ACLK和触发映射；分别记录TIME、事件ID、所属定时器、ADC接口及通道，保留原始时序证据。",
        "分别验证同接口同拍、不同拍、FIFO积压及双ADC同步对；对照ECOL、EMISS、DLYCNT和真实采样时刻，不用“最终拿到一个值”代替期限验收。",
        "用两个已知低压输入和可控通道跳变检查模拟建立、采样偏移及配对等待；核对第三路采样差异，检查错误时不会交付旧值或伪造缺失样本。",
        "验证上一周期预触发的首帧、稳定帧、负载变化和异常停止；记录DMA完成、帧状态确认和下一触发之间的最坏余量。未经台架证据不宣称时序配置达标。"
      ]
    },
    {
      "label": "07 / TRANSFER THE CHECK",
      "title": "练习：先列事件清单，再画采样时间轴",
      "paragraphs": [
        "练习一：三个事件放在同一定时器、同一ADC、同一TIME，FIFO为空时预计哪个ID胜出？把其中一个移到TMR1但保持同拍，又会怎样？将TIME分开后，还缺哪些证据才能证明三路都按时采样？",
        "练习二：在80 MHz系统时钟下，分别计算1600 ticks和4–5 ticks的时间；再解释为什么不能把DLYCNT当作ADC结果的采样时间。对照上一页的FIFO容量与本页入口竞争，写出“容量足够仍可漏事件”的反例。",
        "资料版权归Analog Devices；本站只链接原始文档，提供原创解释、整数算术和受限仲裁模型，不转载图表或厂商示例代码。未运行候选固件、开发工具或硬件；没有本站或独立第三方实物复现。当前器件勘误、完整TRU映射、模拟输入预算和真实最坏延迟仍待项目核验。新材料保持待学习，不改变手动进度。"
      ]
    }
  ]
});
window.SensorCaseOverviews["adi-adcc-event-collision"] = {
  "problem": "同一定时器的三个采样事件送往同一ADC且TIME相同，即使FIFO还空着，也可能只处理一个；队列深度无法替代入口仲裁检查。",
  "method": "分开核对事件匹配、FIFO排队、双ADC配对、实际采样和帧交付，再按各自时钟换算时间。",
  "boundary": "历史ADI手册与原创受限模型，未板测；官方事件时间单位及表格存在差异，没有给出可烧录配置。",
  "takeaway": "先证明每个事件被接收，再证明它何时采样，最后证明整帧已交付，三步各要自己的证据。"
};
