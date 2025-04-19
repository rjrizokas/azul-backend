export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://rjrizokas.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // Preflight запрос отдаем пустым
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = "rjrizokas/azul-rounds";
  const path = "history.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  const { newGeneration } = req.body;

  if (!token) {
    return res.status(500).json({ error: "GitHub token is not configured" });
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    let content = [];
    let sha;

    if (response.status === 404) {
      content = [newGeneration];
    } else if (response.ok) {
      const data = await response.json();
      sha = data.sha;
      content = JSON.parse(Buffer.from(data.content, "base64").toString());
      content.push(newGeneration);
    } else {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const encodedContent = Buffer.from(
      JSON.stringify(content, null, 2)
    ).toString("base64");

    const updateResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message:
          response.status === 404
            ? "Created history.json with first generation"
            : "Added new generation",
        content: encodedContent,
        sha,
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update file: ${updateResponse.status}`);
    }

    const result = await updateResponse.json();
    return res.status(200).json({ success: true, result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error writing to GitHub" });
  }
}
