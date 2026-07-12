UPDATE Notifications
SET Message = SUBSTRING(Message, 1, CHARINDEX('href="/seller/orders/', Message) + 19) + 
              SUBSTRING(Message, CHARINDEX('"', Message, CHARINDEX('href="/seller/orders/', Message) + 20), LEN(Message))
WHERE Message LIKE '%href="/seller/orders/%"%' AND Message NOT LIKE '%href="/seller/orders"%'
