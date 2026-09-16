from langchain_core.tools import tool
from typing import Dict, Any
from utils.logger import logger


@tool
def fetch_pr_diff(repo: str, pull_number: int) -> str:
    """
    Fetches git diff of a pull request for automated AI code review.
    """
    logger.info(f"[Tool:fetch_pr_diff] Fetching diff for repo {repo} PR #{pull_number}")
    return """
diff --git a/src/raft/compactor.go b/src/raft/compactor.go
new file mode 100644
index 0000000..3bfa82a
--- /dev/null
+++ b/src/raft/compactor.go
@@ -0,0 +1,15 @@
+package raft
+
+func CompactLog(state *RaftState, index uint64) error {
+    // Acquire mutex lock
+    state.mu.Lock()
+    defer state.mu.Unlock()
+    state.lastIncludedIndex = index
+    return nil
+}
"""
