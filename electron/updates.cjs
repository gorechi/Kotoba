const { net } = require('electron')

const RELEASES_API = 'https://api.github.com/repos/gorechi/Kotoba/releases/latest'

/**
 * Проверяет последний релиз на GitHub через сетевой стек Electron.
 * Ничего не скачивает и не устанавливает — только возвращает данные релиза.
 */
async function checkUpdates(currentVersion) {
  try {
    const response = await net.fetch(RELEASES_API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': `Kotoba/${currentVersion}`,
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) {
      return { currentVersion, error: `GitHub API ${response.status}` }
    }
    const release = await response.json()
    return {
      currentVersion,
      latestVersion: release.tag_name,
      releaseUrl: release.html_url,
      releaseName: release.name,
      publishedAt: release.published_at,
    }
  } catch (error) {
    return { currentVersion, error: String(error) }
  }
}

module.exports = { checkUpdates, RELEASES_API }
