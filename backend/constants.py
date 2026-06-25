from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")
SESSION_DAYS = 7
PASSWORD_MIN_LENGTH = 8
CONTENT_MAX_LENGTH = 50
VALID_STATUSES = {"default", "inProgress", "completed"}
STATUS_PRIORITY = {"inProgress": 0, "default": 1, "completed": 2}
