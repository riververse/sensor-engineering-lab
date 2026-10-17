window.SensorContent = {
  adc: {
    title:'ADC 为什么还没读准？', subtitle:'让采样电容先追上输入，再谈分辨率。', eyebrow:'02 / ACQUISITION', code:'LAB 02 — SAMPLE & HOLD',
    goal:'把源阻抗从 47 kΩ 降到 1 kΩ，再试着只延长采样时间。哪一种改变让误差进入半 LSB？',
    intro:'“ADC 是 12 位”说的是刻度有多细。输入刚切换时，内部电容可能还没充到目标电压，读数便已经被锁住。先在这块实验台上看见这个过程。',
    sections:[
      ['01 / LOOK CLOSER','采样不是瞬间复制电压',`<p>把采样电容想成一个小水杯。输入电压是目标水位，源电阻和开关电阻一起限制“进水速度”。采样开关只打开一小段时间，关上时杯里有多少，就留下多少。</p><p>这里目标输入固定为 <strong>2.800 V</strong>。绿色曲线是电容电压，橙色虚线是目标。采样结束后曲线变平，意味着进入保持阶段；并不意味着电压已经准确。</p><div class="callout">先盯住采样窗口末端的缺口。把 ADC 位数从 12 改成 16，曲线不会更快，允许的缺口却变得更小。</div>`],
      ['02 / TRY IT','用三个动作建立直觉',`<ol class="steps"><li><span>点“高阻源”，观察电容还没到目标就被保持。此时加数字平均无法消除这种方向一致的建立误差。</span></li><li><span>点“延长采样”，保持源阻抗不变，让电容多追赶一段时间。比较采样窗口和残差。</span></li><li><span>回到高阻源，再点“再采一次”。在本模型保留电荷、输入不变的假设下，第二次更接近目标。真实 ADC 是否如此，要看其架构和数据手册。</span></li></ol>`],
      ['03 / UNDERSTAND','一个时间常数，还不够',`<p>电容每经过一个时间常数，<strong>剩余的差距</strong>大约变成原来的 36.8%。它不是每次固定增加同样的电压，因此最后一点差距需要更多时间。</p><div class="formula-box">τ = (Rsource + Rswitch) × Csample<br>Vcap(t) = Vin + (Vstart − Vin) × exp(−t / τ)<small>电阻用 Ω、电容用 F，τ 就是秒。页面把结果换成 µs；1 µs = 10⁻⁶ s。</small></div><details><summary>再看一层：半 LSB 建立时间怎么算？</summary><div><p>本实验将建立残差限为半个理想 LSB。它只是误差预算中的一项，不代表整个 ADC 达到该精度。</p><div class="formula-box">LSB = Vref / 2ᴺ<br>|Vcap − Vin| ≤ Vref / 2ᴺ⁺¹<br>t ≥ τ × ln(|Vstart − Vin| / (LSB / 2))<small>当初始差距已经小于门限，所需时间取 0。满幅阶跃时，12 位 ADC 需要约 9.011τ；本页默认阶跃是 2.6 V，并非满幅 3.3 V。</small></div><dl class="symbol-list"><dt>Rsource</dt><dd>信号源等效电阻；包括分压网络等对输入的影响。</dd><dt>Rswitch / Csample</dt><dd>芯片内部开关与采样电容。这里用 1 kΩ、10 pF 演示，不是某款 STM32 的保证值。</dd><dt>Vstart</dt><dd>采样开始前电容电压。本实验假设保留上一通道/上次电荷；实际行为与架构有关。</dd></dl></div></details>`],
      ['04 / ON THE BENCH','遇到首点偏差，按顺序排查',`<ul class="checklist"><li>固定一个输入通道，降低源阻抗或延长采样时间，检查偏差是否随之收敛。</li><li>区分采样时间和转换时间。只降低触发频率，不一定延长芯片内部采样窗口。</li><li>多通道扫描时，检查通道顺序、相邻通道电压差和丢弃首样的适用条件。</li><li>有外接电容或运放时，检查驱动器稳定性、恢复时间与电荷回冲，不要直接套单一 RC。</li></ul><p>与 ST AN2834 的输入源阻抗、采样时间章节对照；TI SPRACT6A 进一步讨论采样电容初始条件和电荷共享。<a class="source-inline" href="#sources">查看原始资料 ↗</a></p>`]
    ],
    boundary:'单极 RC 理想模型；不包含量化、INL/DNL、漏电、输入钳位、外接储能电容、电荷注入、参考噪声或驱动放大器动态。半 LSB 仅约束建立残差。'
  },
  error: {
    title:'读数很稳，就一定准吗？',subtitle:'把整体偏差与随机抖动拆开看。',eyebrow:'04 / MEASUREMENT ERROR',code:'LAB 04 — ERROR & REPEATABILITY',
    goal:'先让 32 个读数聚得很紧，再故意加 2 kPa 零点偏差。为什么标准差很小，测量仍然不准？',
    intro:'同一个参考压力，连续读 32 次。误差图比原始读数更容易暴露问题：整体离零有多远，点与点之间又散得多开？这里的每个读数都是合成数据。',
    sections:[
      ['01 / LOOK CLOSER','两种问题，不该混成一种',`<p><strong>整体偏差</strong>让读数总往同一个方向偏。<strong>随机噪声</strong>让每次读数上下摆动。把它们画成“测量值 − 参考值”，目标就变成一条清楚的零线。</p><p>点“稳定但偏高”：散点挤在一起，却离零很远。点“随机抖动”：散点围绕零展开。前者需要找偏差来源，后者需要研究噪声和带宽。</p><div class="callout">“准确度”描述与参考值接近的程度；“重复性”关注相同条件下反复测量的离散。实际参考本身也有不确定度，本实验暂把参考视为准确。</div>`],
      ['02 / TRY IT','换一个工作点，偏差来源就更清楚',`<ol class="steps"><li><span>选“稳定但偏高”，把参考值从 20 改到 80 kPa。纯零点偏差在各点大致一样。</span></li><li><span>选“增益偏高”，同样改变参考值。越接近量程高端，偏差越大。</span></li><li><span>只增大噪声，观察标准差。点“重新采样”，同样设置也会得到不同的有限样本均值。</span></li></ol>`],
      ['03 / UNDERSTAND','先算误差，再谈统计量',`<div class="formula-box">测量值 = 真实值 × (1 + g / 100) + b + σz<br>误差 = 测量值 − 参考值<small>g 为增益偏差百分比；b 用 kPa；σ 是噪声的设定标准差（kPa）；z 是独立标准正态随机数。量程示例为 0–100 kPa，模型不裁剪超量程读数。</small></div><p>这里显示的是 <strong>32 次误差的均值</strong>、<strong>32 个读数的样本标准差</strong>以及<strong>本批最大绝对误差</strong>。它们描述的对象不同，不能互相替代。</p><details><summary>平均能解决什么，不能解决什么？</summary><div><p>若噪声彼此独立、均值为零，M 次平均的随机标准差约变为 σ/√M。平均 16 次，随机抖动约缩到 1/4；一个固定 +2 kPa 的偏差仍然是 +2 kPa。</p><p>温漂、低频漂移、周期干扰或样本相关性会破坏这个简单假设。平均还会增加延迟，响应速度也必须进入工程权衡。</p><div class="formula-box">样本标准差 s = √[Σ(xᵢ − x̄)² / (n − 1)]<small>这里 n = 32。重新采样只更换随机种子，不改变你设置的偏差或噪声强度。</small></div></div></details>`],
      ['04 / ON THE BENCH','让测试记录能回答问题',`<ul class="checklist"><li>同时保存参考值、原始值、时间戳、温度与量程设置；不要只保存滤波后的“漂亮”结果。</li><li>先在一个稳定工作点重复测，再测多个工作点；分别看噪声、零点和增益变化。</li><li>“最大误差”需要说明样本数、条件和范围。本页最大值只是这 32 个样本，不能当产品最坏情况保证。</li><li>比较滤波前后时，同时记录静态噪声和阶跃响应，避免只优化平滑度。</li></ul><p>可导出当前合成 CSV，练习自己画误差图。没有上传、账号或云端数据存储。</p>`]
    ],
    boundary:'固定环境、理想参考、独立正态噪声；不包含温漂、迟滞、老化、频率相关噪声或样本间相关性。页面结果不是任何产品的性能规格。'
  },
  calibration:{
    title:'标定点很准，还不够',subtitle:'用没参与拟合的数据，检查标定有没有用。',eyebrow:'05 / CALIBRATION',code:'LAB 05 — TWO-POINT CALIBRATION',
    goal:'先保持非线性为 0，观察两点标定消除偏差。再把弯曲误差调到 2 kPa：为什么中间点仍然偏？',
    intro:'零点和满量程用于求两个系数。10%、25%、50%、75%、90% 的参考点留到最后才检查。训练数据与验证数据分开，才不会把“拟合过了”误认为“测准了”。',
    sections:[
      ['01 / LOOK CLOSER','两点决定一条直线，决定不了一条曲线',`<p>先在 0、100 kPa 各测 16 次并取均值，分别估计零点和跨度。两点标定相当于先减掉整体偏移，再把刻度缩放回正确间距。</p><p>图中灰色三角是参与拟合的两个端点；圆点才是<strong>没有参与拟合的验证点</strong>。橙色是标定前误差，绿色是标定后误差。</p><div class="callout">端点的均值残差会被两参数拟合强制拉到零。这是算法的性质，不能独立证明测量准确。请把目光移到中间的绿色圆点。</div>`],
      ['02 / TRY IT','把模型用对，也要知道它在哪里失效',`<ol class="steps"><li><span>点“线性偏差”，对比标定前后验证均值最大残差。零点和增益是两点法擅长处理的部分。</span></li><li><span>点“带非线性”，观察中间残差拱起来。端点仍然很好，但量程内部并不好。</span></li><li><span>点“噪声较大”，再“重新采集并标定”。系数也会受有限样本影响；参考源和标定环境同样重要。</span></li></ol>`],
      ['03 / UNDERSTAND','把“减零点、除斜率”写成式子',`<div class="formula-box">b̂ = 0 kPa 处的原始均值<br>ŝ = (100 kPa 均值 − 0 kPa 均值) / 100<br>校正值 = (原始值 − b̂) / ŝ<small>b̂ 单位是 kPa；ŝ 是无量纲斜率。例如 b̂ = 2 kPa、ŝ = 1.03，则原始 53.5 kPa 被校正成 50 kPa。</small></div><details><summary>为什么弯曲误差保留下来了？</summary><div><p>合成模型额外加了一项 a × 4u(1 − u)，其中 u = 真实压力 / 100。它在两个端点都等于零，却在中点达到 a。两点校准根本看不到这个弯曲部分。</p><div class="formula-box">原始值 = x × (1 + g / 100) + b + a × 4u(1 − u) + σz<small>本页 a 是中点弯曲量，单位 kPa。它只是一种示意非线性，不代表特定传感器机理。</small></div><p>多点分段或多项式可能减少系统性的弯曲，但也可能过拟合噪声。应另留验证点，并检查温度、批次、上下行和量程外行为。</p></div></details>`],
      ['04 / ON THE BENCH','先定义验收，再保存系数',`<ul class="checklist"><li>按应用先定误差门限，再决定参考点、温度、稳定时间、重复次数与上下行顺序。</li><li>拟合数据、独立验证数据分开保存；CSV 中用 training / validation 明确标记。</li><li>本页主图是每个参考点 16 次的均值残差；“单次验证 RMSE”则使用全部 80 个验证样本，二者不能混读。</li><li>固件保存系数时，需要版本、单位、量程、CRC 和回退策略。不能把异常系数直接用于出厂测量。</li></ul><p>参考 ADI AN-1464 对偏移/增益校准的讨论；本页使用通用理想模型，不复现特定芯片的寄存器流程。<a class="source-inline" href="#sources">查看资料 ↗</a></p>`]
    ],
    boundary:'只拟合零点与增益；0、100 kPa 各 16 个训练样本，五个内部参考点各 16 个独立验证样本。噪声为合成数据，参考值无误差；没有温漂、迟滞或长期稳定性保证。'
  }
};
Object.assign(window.SensorContent,{
 driver:{
  title:'信号接上去，为什么变了？',subtitle:'分开理解加载、带宽与输出摆幅。',eyebrow:'01 / INPUT & DRIVER',code:'LAB 01 — THE ANALOG FRONT END',
  goal:'先点“源阻抗加载”，再点“逼近带宽”。两条波形都变小了，但电路里发生的是同一件事吗？',
  intro:'传感器输出不是一个永远不变的理想电压。后级会取电流，运放也有速度和摆幅限制。先用一个明确的简化信号链，分清三种常被混在一起的“带不动”。',
  sections:[
   ['01 / READ THE CIRCUIT','先把等效电路画清楚',`<div class="circuit-strip" role="img" aria-label="信号源经过源电阻到达输入负载，再进入增益10的运放，最后到ADC"><div class="circuit-node">信号源<small>源电阻 Rs</small></div><span class="circuit-arrow">→</span><div class="circuit-node">输入节点<small>负载 RL 对交流地</small></div><span class="circuit-arrow">→</span><div class="circuit-node">非反相运放<small>增益 10 / GBW 1 MHz</small></div><span class="circuit-arrow">→</span><div class="circuit-node">ADC 输入<small>下一节看采样动态</small></div></div><p>本实验的输入负载是一个<strong>明确给定的电阻</strong>，不是某款 ADC 的通用输入模型。信号先在 Rs 与 RL 上分压，再经过运放的一阶小信号响应，最后用固定上下限示意输出削顶。</p><p>交流信号最终围绕 <strong>1.65 V</strong> 摆动。运放的教学输出范围设为 0.2–3.1 V；具体器件能到哪里，取决于供电、负载和温度。</p><div class="callout">直流加载是“最后也到不了原电压”；建立不足是“本来能到，但采得太早”。延长等待能检查后者，却修复不了前者。</div>`],
   ['02 / TRY IT','逐个拆开“变小”的原因',`<ol class="steps"><li><span>点“源阻抗加载”，把负载从 100 kΩ 增到 1 MΩ。取流变少，源电阻压降减小，绿色幅度更接近目标。</span></li><li><span>点“逼近带宽”，信号达到 100 kHz。即使负载很轻，运放增益也已从低频的 10 降到约 7.071，还出现相位滞后。</span></li><li><span>点“输出削顶”。继续提高输入，峰顶不再上升。线性标定不能恢复已经丢失的峰值信息。</span></li></ol>`],
   ['03 / UNDERSTAND','先算加载，再核对动态限制',`<div class="formula-box">Vload = Vsource × RL / (Rs + RL)<small>10 kΩ 源电阻、100 kΩ 负载：幅度剩 90.909%。若空载 3.3 V，接上后就是 3.000 V。</small></div><p>分压器的中点向前看，也有源阻抗。理想供电下，两个 10 kΩ 电阻的中点等效源阻抗是 <strong>10 kΩ ∥ 10 kΩ = 5 kΩ</strong>，不是 20 kΩ。</p><details><summary>如果输入节点还并联了一个电容呢？</summary><div><p>对明确的 Rs–(RL∥C) 网络，直流增益仍由电阻分压决定，时间常数则是两个电阻并联后乘电容。</p><div class="formula-box">τ = (Rs ∥ RL) × C<br>fc = 1 / (2π τ)<small>只有 RL 远大于 Rs，才可近似 τ ≈ Rs × C。这个连续低通不能直接替代 ADC 内部开关采样模型。</small></div><p>外接电容可能帮助提供采样瞬间的电荷，但它还要从信号源恢复，也可能让运放在容性负载下振铃。“多加电容”不是通用修复方案。</p></div></details><h3>运放需要过五道检查</h3><ul><li><strong>输入共模：</strong>3.3 V 供电不表示输入允许覆盖完整 0–3.3 V。</li><li><strong>输出摆幅：</strong>轨到轨输出通常仍需余量，还要看实际负载。</li><li><strong>闭环带宽：</strong>本例非反相噪声增益为 10，一阶近似 fc = GBW/10 = 100 kHz。</li><li><strong>压摆率：</strong>输出 1 V 峰值、100 kHz 正弦，最大斜率约 0.628 V/µs。还需余量与失真验证。</li><li><strong>建立与稳定性：</strong>进入误差带后能否保持，不能仅用 GBW 代替。</li></ul><details><summary>本实验如何近似频率响应？</summary><div><div class="formula-box">相对低频幅度 = 1 / √[1 + (f/fc)²]<br>相位 = −atan(f/fc)<small>适用于本例主极点占优的非反相电压反馈放大器近似。截止频率处幅度是 0.707 倍，已经下降 29.3%。</small></div><p>波形在一阶线性响应后作硬限幅，只用于区分现象；不是实际运放的非线性饱和、恢复或稳定性仿真。本页计算压摆率需求，但没有模拟压摆率限制。</p></div></details>`],
   ['04 / ON THE BENCH','缓冲器是一个器件，不是万能答案',`<ul class="checklist"><li>静态已经偏低：先查加载、偏置电流、连线压降与量程。</li><li>低频正常、高频变小：分别量滤波器与运放前后，核对闭环幅频响应。</li><li>靠近上下限突然不线性：检查输入共模与输出摆幅。</li><li>接上 ADC 才出现尖峰或振铃：结合采样时序，检查驱动网络、容性负载与恢复时间。</li></ul><p>TI SBOA356 和运放电压范围/建立时间文章提供进一步检查依据。下一节将把“后级负载”换成采样电容。<a class="source-inline" href="#sources">官方资料 ↗</a></p>`]
  ],
  boundary:'电阻加载 + 非反相单极小信号响应 + 教学硬限幅串联示意；不是物理器件大信号模型。不包含压摆率限制、过载恢复、输入共模失败、偏置电流或 ADC 电荷回冲。'
 },
 reference:{
  title:'输入没变，尺子变了。',subtitle:'ADC 转换的是输入与参考的比例。',eyebrow:'03 / VOLTAGE REFERENCE',code:'LAB 03 — THE MEASUREMENT RATIO',
  goal:'让参考电压升高 1%，先猜读数向哪边走。再切成“信号与参考同比变化”，观察同一变化为什么能被抵消。',
  intro:'程序里写下的 3.3 V 只是名义值。真实参考可能偏一点，也可能带着波动。理解 ADC 的分子和分母，才能分清输入问题与“刻度”问题。',
  sections:[
   ['01 / LOOK CLOSER','参考电压决定一格有多大',`<p>理想 ADC 看的是 Vin / Vref。固定输入占参考的比例越大，码值越大；如果输入保持不动、参考升高，它在整个量程中所占的比例反而下降。</p><p>本页用一个 0–100 kPa 的合成传感器：名义 3.3 V 对应满量程。为了只看比例关系，图中不做整数码量化。</p><div class="callout">真实压力 50 kPa，参考偏高 1%，独立信号不变时，报告值约为 49.505 kPa，误差约 −0.495 kPa。方向先想对，比死记换算公式更重要。</div>`],
   ['02 / TRY IT','一个变化，放在分母，或同时放在两边',`<ol class="steps"><li><span>点“参考偏高”，把直流偏差从 +1% 改成 −1%。观察平均误差的方向和大小。</span></li><li><span>点“参考有纹波”，真实输入仍不变，读数却随参考起伏。提高分辨率并不会消除这条曲线。</span></li><li><span>点“理想比率测量”，信号与参考完全同幅同相地变化，比例保持不变。再读下面的适用条件。</span></li></ol>`],
   ['03 / UNDERSTAND','比率测量的抵消，有前提',`<div class="formula-box">连续理想码值 D* = 2ᴺ × Vin / Vref<br>按名义参考换算 = Vin × Vref_nom / Vref_actual<small>D* 是连续数学值，真实 ADC 输出有量化与端点限制。实际器件编码与输入类型以数据手册为准。</small></div><p>某些电阻桥传感器的输出随激励成比例。若 Vin = k(x) × Vexc，同时 Vref = α × Vexc，那么：</p><div class="formula-box">Vin / Vref = k(x) / α<small>例如 k = 0.4、α = 1：激励 3.0 V 时输入 1.2 V；激励 3.3 V 时输入 1.32 V。两种情况的比例都为 0.4。</small></div><p>电流激励的电阻测量也类似：用同一电流流过传感电阻和参考电阻，比值就变成 Rsensor / Rref。此时参考电阻的精度、温漂和布线同样关键。</p><details><summary>为什么真实系统不一定完全抵消？</summary><div><ul><li>传感器输出必须确实随同一激励成比例，任意电压输出传感器并不满足。</li><li>两条路径的压降、滤波、相位或采样时刻不同，会让变化不再完全共同。</li><li>独立噪声、固定失调、非线性、自热和饱和，不会因为一次相除消失。</li><li>输入和参考仍要在允许范围内，也要满足驱动和去耦要求。</li></ul><p>ADI 的 RTD 比率测量文章特别讨论信号与参考路径的匹配。图中零误差只是理想同比模型的结果。</p></div></details>`],
   ['04 / ON THE BENCH','先确认基准来自哪里',`<ul class="checklist"><li>查看原理图和具体芯片手册：VREF+ 与 VDDA 如何连接，有无独立参考与缓冲？</li><li>同时检查参考直流值与动态波动。万用表能看慢偏差，却不会展示所有转换瞬间的扰动。</li><li>多个通道一起按比例偏：先查共同参考、电源和软件换算，再逐通道排查。</li><li>别把名义参考值直接当精确值，也别用一次测得的常数覆盖所有温度与负载。</li></ul><p>ST AN2834 的参考与电源章节，和 ADI 的激励/比率测量资料，是继续阅读的起点。<a class="source-inline" href="#sources">官方资料 ↗</a></p>`]
  ],boundary:'理想连续比例、固定压力与单一正弦参考波动。比率模式假设信号与参考完全同幅同相，无失配、独立噪声、量化、动态负载或端点饱和。'
 },
 debug:{
  title:'先找到原因，再修饰波形。',subtitle:'把示波器、回流路径与采样时序一起检查。',eyebrow:'06 / DEBUG & VERIFY',code:'LAB 06 — DIAGNOSIS WORKBENCH',
  goal:'选择一个现象，先决定下一步检查动作，再看它能排除什么。不要先用滤波把异常藏起来。',
  intro:'同一条“不好看”的曲线，可能来自信号本身、参考电压、采样时序，也可能是探头带来的。好的排障不是一下猜中，而是每一步都缩小范围。',
  sections:[
   ['01 / SAFETY FIRST','先确认安全，再连接仪器',`<div class="callout"><strong>本节只面向已确认安全隔离的低压直流板卡。</strong>板上写着 3.3 V，不代表它对大地安全。电源、USB、调试器和外设都可能改变电位关系；不清楚时先停下连接，由具备资质的人员确认。</div><p>普通台式示波器的探头地通常与保护地相连，通道地往往互通。<strong>不要拆除保护地、使用去地转接头，或把普通探头地夹接到市电、未知高侧、开关节点。</strong></p><p>两个非接地节点之间的电压，需要适合该任务的差分探头或隔离测量设备；同时核对差模、共模对地电压、测量类别、带宽和绝缘额定值。双通道相减不提供电气隔离，电池供电也不自动表示安全隔离。</p><p><a class="source-inline" href="https://www.tek.com/en/documents/whitepaper/abcs-probes-primer" target="_blank" rel="noopener noreferrer">Tektronix · ABCs of Probes ↗</a></p>`],
   ['02 / FOLLOW THE RETURN','“地”也有阻抗，电流总要回来',`<p>原理图里同名的地，在铜箔上仍有距离。如果大电流或快速数字回流经过敏感参考的共用路径，这段路径会产生电位变化。</p><div class="formula-box">慢变化：ΔV = ΔI × R<br>快速边沿：ΔV = L × di/dt<small>100 mA × 50 mΩ = 5 mV。对 3.3 V、12 位 ADC，这是约 6.206 LSB 的电压尺度。真正进入读数的大小与符号，取决于信号和参考各自的回流路径。</small></div><p>布局的重点是缩小高频电流环路，让快速、大电流回流避开敏感信号与参考。不要只看到 AGND、DGND 就机械切开地平面；错误分割可能迫使回流绕路。</p><h3>去耦要看路径，不只看容量</h3><p>电容应按器件要求，就近提供短促电流。检查引脚到电容、再到回流的实际环路，以及容量随直流偏压的变化、ESR/ESL 和稳定性要求。加电容、磁珠或 LDO 都需要验证，不是保证降噪的按钮。</p>`],
   ['03 / CHECK THE MEASUREMENT','先排除探头制造的异常',`<p>只在确认可与示波器保护地相连的本地参考点，使用适当且尽量短的接地连接。长地线形成拾取环路与寄生电感，可能让尖峰或振铃变得夸张。</p><ol class="steps"><li><span>核对探头倍率、补偿、输入电容与仪器设置。高阻节点可能被探头本身加载。</span></li><li><span>在同一本地参考点检查测量链路本底，并比较同一测点的短接地连接与原连接。如果差别大，先怀疑测量路径。</span></li><li><span>DC 耦合看电平与削顶；放大纹波时记录偏移、耦合和带宽设置。AC 耦合会隐藏直流及慢变化。</span></li><li><span>全带宽与带宽限制可以对照观察。显示更平滑，不等于电路噪声消失。</span></li></ol><p>TI 的纹波测量资料对短接地和测量伪影给出了具体示例。<a class="source-inline" href="https://www.ti.com/lit/pdf/ssztb25" target="_blank" rel="noopener noreferrer">How to Measure Ripple ↗</a></p>`],
   ['04 / MAKE ONE CHANGE','每次只改一个因素，保留原始码',`<ol class="steps"><li><span><strong>固定条件。</strong>记录输入参考、通道顺序、采样时间、触发速率、供电和原始码。先不要叠加很多补偿。</span></li><li><span><strong>检查静态工作点。</strong>依次看传感器输出、运放供电/输出、ADC 参考和输入。先解决削顶或量程不对。</span></li><li><span><strong>对齐时间。</strong>沿信号链观察异常是否集中在采样瞬间、通道切换或可控数字负载变化时。探头没看见，不等于事件不存在。</span></li><li><span><strong>改一个因素。</strong>分别延长采样、改变通道顺序，或在允许范围内断电后换成已知低阻源。每次复测保持其他设置一致。</span></li><li><span><strong>扩展验证。</strong>改动有效后，再扫输入范围、采样速率、顺序与允许温度，不用单点好结果替代全部验证。</span></li></ol><div class="callout">最后问自己：现在变的是输入，还是参考这把尺子？或者，变化是测量工具自己带进来的？</div>`]
  ],boundary:'三个案例均为合成观测示意，不是实测波形或根因自动识别。形状只能提供线索，需要结合安全测量、器件条件与控制变量实验验证。'
 }
});
window.HardwareSources=[
 ['TI','SBOA356 · 精密运放级联与带宽','GBW、闭环带宽与精密幅度要求。本站单极模型只用于非反相、主极点占优的近似。','https://www.ti.com/lit/pdf/sboa356','August 2020'],
 ['TI','运放输入输出范围与建立时间','输入共模、输出摆幅与真实建立时间需要分别检查，不能从电源电压或 GBW 单独推断。','https://e2e.ti.com/blogs_/archives/b/thesignal/posts/op-amp-voltage-ranges-input-and-output-clearing-some-confusion','May 8, 2012'],
 ['TI','Settling Time · 运放建立时间','建立时间与阶跃幅度、增益、容许误差带有关。','https://e2e.ti.com/blogs_/archives/b/thesignal/posts/settling-time','June 11, 2013'],
 ['ADI','Transducer/Sensor Excitation and Measurement Techniques','传感器激励、电阻测量及比率关系的基础。','https://www.analog.com/en/resources/analog-dialogue/articles/transducer-sensor-excitation-and-measurement-techniques.html','Analog Dialogue 34-5 · 2000'],
 ['ADI','RTD Ratiometric Front-End Design','真实比率测量的信号路径与参考路径匹配、滤波及实现边界。','https://www.analog.com/en/resources/analog-dialogue/articles/afe-design-considerations-rtd-ratiometric.html','Analog Dialogue 50-03 · March 2016'],
 ['ADI','AN-1142 · 高速 ADC PCB 布局','回流路径、去耦与地平面；不要机械地按模拟/数字标签切割地。具体芯片建议仍优先。','https://www.analog.com/en/resources/app-notes/an-1142.html','Rev 0 · January 2012'],
 ['TI','SSZTB25 · 如何正确测量纹波','短接地路径、探头拾取与纹波测量伪影。','https://www.ti.com/lit/pdf/ssztb25','July 2016'],
 ['TEK','ABCs of Probes Primer','探头影响、接地、差分与隔离测量。安全段采用仪器厂商资料；在线版未显示可核验版次日期。','https://www.tek.com/en/documents/whitepaper/abcs-probes-primer','在线资料 · 未标明版次日期']
];
