import httpx
from typing import Optional, Dict, Any
from utils.logger import logger


class GitHubService:
    def __init__(self, token: Optional[str] = None):
        self.token = token
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AI-Project-Manager-Swarm",
        }
        if token:
            self.headers["Authorization"] = f"token {token}"

    async def fetch_pull_request_diff(self, owner: str, repo: str, pull_number: int) -> str:
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}"
        diff_headers = {**self.headers, "Accept": "application/vnd.github.v3.diff"}
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=diff_headers)
            if res.status_code == 200:
                return res.text
            logger.warning(f"Could not fetch PR diff ({res.status_code}): {res.text}")
            return ""


github_service = GitHubService()
