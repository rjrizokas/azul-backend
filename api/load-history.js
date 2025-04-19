export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = "rjrizokas/azul-rounds";
  const path = "history.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

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

    if (response.status === 404) {
      return res.status(200).json([]);
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const content = JSON.parse(Buffer.from(data.content, "base64").toString());
    return res.status(200).json(content);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error reading from GitHub" });
  }
}
