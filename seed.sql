-- Seed default event
INSERT INTO "Event" (
    id, 
    name, 
    description, 
    date, 
    venue, 
    "organizerName", 
    "organizerEmail", 
    "organizerPhone", 
    passcode, 
    "isActive", 
    "maxUploadSize", 
    "allowedFormats", 
    "storageQuota", 
    "storageUsed", 
    "createdAt", 
    "updatedAt"
) VALUES (
    'default-event-id',
    'Sarah & John Wedding',
    'A beautiful celebration of love',
    '2024-12-25',
    'Grand Ballroom Hotel',
    'Wedding Organizer',
    'organizer@example.com',
    '+1234567890',
    '1234',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    10737418240,
    0,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Seed sample tables
INSERT INTO "Table" (
    id,
    "eventId",
    "tableNumber",
    "tableName",
    "qrCode",
    "createdAt"
) VALUES 
    (
        'table-1-id',
        'default-event-id',
        '1',
        'Family Table',
        'table-1-qr',
        NOW()
    ),
    (
        'table-2-id',
        'default-event-id',
        '2',
        'Friends Table',
        'table-2-qr',
        NOW()
    )
ON CONFLICT DO NOTHING;
