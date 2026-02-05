
export default async function handler(req, res) {
  // 设置 CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.VITE_API_KEY || process.env.DASHSCOPE_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    // 针对微信整蛊优化的 Prompt
    const prompt = `
      请你扮演一个来自未来的、刻薄的、毒舌的 AI "人类质量检测员"。
      请查看这张照片（如果是自拍）。请根据面相、表情、穿搭、背景或光线，生成一份"人类质量检测报告"。

      要求：
      1. 语言：中文（简短、好笑、极其毒舌、不要带脏字但要扎心）。
      2. 观察点（必须随机选择一个重点，不要总是吐槽发际线！）：
         - 眼神：(例如：清澈愚蠢、死鱼眼、像三天没睡、透露着没被知识污染过的纯真)
         - 表情：(例如：强颜欢笑、看起来不太聪明的样子、仿佛便秘三天、用力过猛)
         - 穿搭/造型：(例如：乡村非主流、把地摊货穿出了高定感（反讽）、这种配色是色盲设计的吗)
         - 氛围/背景：(例如：散发着单身狗的清香、背景比人好看、这种光线是想拍恐怖片吗)
         - 五官：(例如：五官各长各的谁也不服谁、鼻子比未来还塌、嘴巴像是借来的)

      3. 风格（随机选择一种）：
         - 赛博算命风：用科技词汇胡说八道命运（例如：你的桃花运被防火墙拦截了）。
         - 生物观察风：像在观察某种低等生物（例如：该样本的求偶竞争力为负数）。
         - 阴阳怪气风：表面夸奖实则嘲讽（例如：你这张脸真的很省洗面奶）。
         - 职场PUA风：像个挑剔的老板（例如：你的长相严重影响了公司的平均颜值）。

      4. 内容禁忌：
         - 🚫 禁止每次都从"发际线"开始吐槽！
         - 🚫 禁止使用老梗（如"发际线后退"），要创造新的比喻！

      必须严格返回合法的 JSON 格式，不要包含 Markdown 标记（如 \`\`\`json）：
      {
        "title": "4个字的成语或短语（如：五行缺智、凭实力单身、长得潦草、注定搬砖）",
        "roast": "2-3句话的毒舌点评，必须包含一个具体的、新颖的比喻。",
        "dangerLevel": "60-100之间的整数（危险指数）",
        "score": "0-100之间的整数（作为人类的得分，越低越好笑，例如 5 分）",
        "luckyItem": "一个荒谬的幸运物品（例如：过期传单、别人的WIFI密码、防脱发洗发水、美颜相机）",
        "animalMatch": "一种匹配的生物（例如：树懒、哈士奇、单细胞生物、咸鱼、土拨鼠）"
      }
    `;

    // 阿里云 DashScope (通义千问) 调用逻辑
    // 如果图片包含 data:image 前缀，DashScope 通常需要纯 Base64 或者 URL
    // 这里我们构建 standard format
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'qwen-vl-max',
            input: {
                messages: [{
                    role: 'user',
                    content: [
                        { image: image }, // image 应该是 data:image/jpeg;base64,... 格式，Qwen-VL 支持
                        { text: prompt }
                    ]
                }]
            },
            parameters: {
                result_format: 'message'
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DashScope API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // 解析 DashScope 返回结果
    // 结构通常是 data.output.choices[0].message.content[0].text 或者类似
    const content = data?.output?.choices?.[0]?.message?.content;
    
    if (!content) {
        throw new Error("Invalid response from DashScope");
    }

    // content 是一个数组，通常包含 {text: "..."}
    const textPart = content.find(item => item.text);
    let jsonStr = textPart ? textPart.text : "";

    // 清理可能存在的 Markdown 标记
    jsonStr = jsonStr.replace(/```json\s*|\s*```/g, "").trim();

    try {
        const result = JSON.parse(jsonStr);
        return res.status(200).json(result);
    } catch (e) {
        console.error("JSON Parse Error:", jsonStr);
        throw new Error("AI returned invalid JSON");
    }

  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error?.message || JSON.stringify(error);
    return res.status(500).json({ 
      error: 'Analysis failed', 
      details: errorMessage,
      title: "系统崩溃",
      roast: `检测失败，原因太尴尬了：${errorMessage}。可能是网络问题，也可能是您的长相真的把 AI 吓坏了。`,
      dangerLevel: 999,
      score: -100,
      luckyItem: "报错日志",
      animalMatch: "404 Not Found"
    });
  }
}