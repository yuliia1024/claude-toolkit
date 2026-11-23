---
name: trigger-code-review
tags: [trigger]
runs: 1
max_turns: 6
allowed_tools: [Skill, Read, Glob, Grep]
---
Please review this change before I merge it — it adds a password reset flow.

```diff
+router.post('/reset', async (req, res) => {
+  const user = await db.users.findOne({ email: req.body.email });
+  const token = Math.random().toString(36).slice(2);
+  await db.users.update(user.id, { resetToken: token });
+  await mail.send(user.email, `Reset: https://app.example.com/reset?token=${token}`);
+  res.json({ ok: true, token });
+});
```
