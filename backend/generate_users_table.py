import sys
sys.path.insert(0, '.')
from app.db.session import SessionLocal
from app.models.user import User
from sqlalchemy import select

with SessionLocal() as db:
    users = list(db.scalars(select(User).order_by(User.created_at.desc())))

rows = ""
for i, u in enumerate(users, 1):
    joined = str(u.created_at)[:19].replace('T', ' ')
    rows += f"""
    <tr>
      <td>{i}</td>
      <td><span class="badge">{u.username}</span></td>
      <td>{u.email}</td>
      <td>&#8377;{u.wallet_balance}</td>
      <td>{joined}</td>
    </tr>"""

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Registered Users - 9XBET</title>
<style>
  body {{ font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 30px; }}
  h2 {{ color: #38bdf8; margin-bottom: 5px; }}
  p.sub {{ color: #64748b; margin-bottom: 20px; font-size: 14px; }}
  table {{ width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }}
  th {{ background: #0284c7; color: white; padding: 14px 18px; text-align: left; font-weight: 600; }}
  td {{ padding: 12px 18px; border-bottom: 1px solid #334155; }}
  tr:last-child td {{ border-bottom: none; }}
  tr:hover td {{ background: #273549; }}
  .badge {{ background: #0ea5e9; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }}
  .total {{ margin-top: 15px; color: #94a3b8; font-size: 14px; }}
</style>
</head>
<body>
<h2>9XBET - Registered Users</h2>
<p class="sub">Total Users: {len(users)}</p>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Username</th>
      <th>Email</th>
      <th>Wallet Balance</th>
      <th>Joined At</th>
    </tr>
  </thead>
  <tbody>
    {rows}
  </tbody>
</table>
</body>
</html>"""

with open('registered_users.html', 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Saved: registered_users.html ({len(users)} users)")
