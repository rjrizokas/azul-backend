// api/save-generation.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = 'rjrizokas/azul-rounds';
  const path = 'history.json';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  const { newGeneration } = req.body;

  try {
    // Получаем текущий файл
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const data = await response.json();
    const sha = data.sha;
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString());
    const updatedContent = [...content, newGeneration];
    const encodedContent = Buffer.from(JSON.stringify(updatedContent, null, 2)).toString('base64');

    // Обновляем файл
    const updateResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        message: 'Добавлена новая генерация',
        content: encodedContent,
        sha,
      }),
    });

    const result = await updateResponse.json();
    res.status(200).json({ success: true, result });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка при записи на GitHub' });
  }
}
