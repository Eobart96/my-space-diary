# Database Schema - My Space App

## Overview

The application uses PostgreSQL with three main tables for user management, diary entries, and nutrition tracking.

## Tables

### 1. users

Stores user authentication and profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `email`

### 2. diary_entries

Stores diary entries with optional mood tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique entry identifier |
| user_id | INTEGER | FOREIGN KEY → users(id) ON DELETE CASCADE | User who owns the entry |
| date | DATE | NOT NULL | Entry date |
| text | TEXT | NOT NULL | Diary entry content |
| mood | INTEGER | CHECK (mood >= 1 AND mood <= 5) | Optional mood rating (1-5) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Entry creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Composite index on `(user_id, date)` for efficient user-date queries

### 3. nutrition_entries

Stores nutrition and meal tracking information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique entry identifier |
| user_id | INTEGER | FOREIGN KEY → users(id) ON DELETE CASCADE | User who owns the entry |
| date | DATE | NOT NULL | Meal date |
| time | TIME | NOT NULL | Meal time |
| title | VARCHAR(255) | NOT NULL | Meal title/name |
| calories | INTEGER | CHECK (calories >= 0) | Optional calorie count |
| proteins | DECIMAL(5,2) | CHECK (proteins >= 0) | Optional protein amount in grams |
| fats | DECIMAL(5,2) | CHECK (fats >= 0) | Optional fat amount in grams |
| carbs | DECIMAL(5,2) | CHECK (carbs >= 0) | Optional carbohydrate amount in grams |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Entry creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Composite index on `(user_id, date)` for efficient user-date queries

## Relationships

```
users (1) ──── (N) diary_entries
users (1) ──── (N) nutrition_entries
```

- Each user can have multiple diary entries
- Each user can have multiple nutrition entries
- Deleting a user cascades to delete all their entries

## Data Validation

### Diary Entries
- `mood` must be between 1 and 5 (inclusive)
- `text` and `date` are required fields
- Entries are automatically sorted by date and creation time

### Nutrition Entries
- All numeric values (calories, proteins, fats, carbs) must be non-negative
- `title`, `date`, and `time` are required fields
- Entries are automatically sorted by date and time

## Security Considerations

1. **Password Storage**: Uses bcrypt with salt rounds for secure password hashing
2. **Data Isolation**: User data is isolated by `user_id` foreign key constraints
3. **Input Validation**: Server-side validation ensures data integrity
4. **Cascading Deletes**: Automatically cleans up user data when accounts are deleted

## Performance Notes

1. **Indexes**: Composite indexes on `(user_id, date)` optimize common query patterns
2. **Timestamps**: Automatic timestamp management for creation and updates
3. **Decimal Precision**: Nutrition values use DECIMAL(5,2) for precise decimal storage
4. **Text Storage**: Diary entries use TEXT type for unlimited content length

## Migration Strategy

The database schema is versioned through migration scripts that:
1. Create tables with proper constraints and indexes
2. Set up foreign key relationships
3. Add performance indexes
4. Ensure data integrity through CHECK constraints

Future schema changes should be handled through incremental migration scripts to maintain backward compatibility.
