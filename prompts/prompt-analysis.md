# วิเคราะห์ปัญหา Prompt B และแนวทางแก้ไข

## ปัญหาที่พบ

### 1. โครงสร้าง JSON ผิดพลาด (Critical)

**ที่คาดหวัง (ตาม ENVELOPE SCHEMA):**
```json
{
  "meta": { ... },
  "summary": { ... },
  "posts": [ ... ],
  "metrics": [ ... ],
  "sections": [ ... ],
  "highlights": [ ... ],
  "raw_signals": [ ... ],
  "insights": [ ... ]
}
```

**ที่ได้จริง:**
```json
{
  "task_intent": "...",
  "task_description": "...",
  "sections": [ ... ],
  "overall_sentiment_focus": "...",
  "confidence_note": "..."
}
```

➡️ **AI คืนค่ากลับมาเป็น blueprint structure แทนที่จะเป็น analysis result**

---

### 2. โครงสร้าง `sections[].items` ผิด

**ที่คาดหวัง:**
```json
"sections": [
  {
    "section_id": "s1",
    "section_title": "...",
    "section_type": "bar_chart",
    "items": [
      {
        "item_id": "i1",
        "label": "อนุทิน",
        "value": 5,
        "percent": "50%",
        "sentiment": "negative"
      }
    ]
  }
]
```

**ที่ได้จริง:**
```json
"sections": [
  {
    "section_id": "s1",
    "labels": { "politician_name": "ชื่อนักการเมือง" },
    "data": [
      { "politician_name": "อนุทิน", "count": 5 }
    ]
  }
]
```

➡️ **AI ใช้ `labels` และ `data` แทน `items` และไม่มี `item_id`, `percent`, `sentiment`**

---

### 3. ขาด Required Top-Level Fields

ไม่มีเลย:
- ❌ `meta` (posts_count, comments_count, analyzed_at, data_quality)
- ❌ `summary` (one_line, key_finding, overall_sentiment, confidence_score)
- ❌ `posts` array
- ❌ `metrics` array
- ❌ `highlights` array (คอมเมนต์ที่น่าสนใจ)
- ❌ `raw_signals` array
- ❌ `insights` array (สรุป per post และ cross-post)

---

### 4. Section Type ไม่ตรงตาม Use Case

Section s2 ใช้ `section_type: "list"` แต่ข้อมูลจริงเป็น **grouped comments by politician** ซึ่งควรใช้:
- `table` หรือ
- Custom structure ที่รองรับ nested groups

แต่ **RULE 4 ห้ามใช้ arrays-inside-arrays** ทำให้ขัดแย้ง

---

## สาเหตุหลัก

### 🔴 สาเหตุที่ 1: Prompt สับสนระหว่าง Blueprint และ Output

```
## TASK BLUEPRINT (from planning step)
...
The blueprint is the object that contains ONLY these fields:
task_intent, task_description, analysis_focus, sections...

Scan {{allItems}} for the valid blueprint object.
```

➡️ **ส่วนนี้บอก AI ให้ค้นหา blueprint object ที่มี `task_intent`, `sections` etc.**

แต่ในภายหลังกลับบอกว่า:

```
## ENVELOPE SCHEMA
{
  "meta": { ... },
  "summary": { ... },
  ...
}

## OUTPUT REMINDER
- Return ONLY valid JSON — start with { end with }
- Required top-level fields: meta, summary, posts...
```

➡️ **AI สับสนว่าควร output อะไร → เลือก output blueprint structure แทน**

---

### 🔴 สาเหตุที่ 2: ไม่มีตัวอย่าง Output ที่ถูกต้อง

Prompt ไม่มี:
- ✗ ตัวอย่าง JSON output ที่สมบูรณ์
- ✗ Before/After comparison
- ✗ Reference output สำหรับแต่ละ section_type

➡️ **AI ต้องเดาเองจากคำอธิบาย → เดาผิด**

---

### 🔴 สาเหตุที่ 3: RULE 4 ขัดแย้งกับ Use Case จริง

```
RULE 4: Arrays-inside-arrays FORBIDDEN — use comma-separated strings instead
```

แต่ use case "grouped comments by politician" ต้องการ nested structure:
```json
{
  "politician": "อนุทิน",
  "comments": [
    { "text": "...", "sentiment": "..." },
    { "text": "...", "sentiment": "..." }
  ]
}
```

➡️ **AI พยายามทำตาม rule → ไม่สามารถจัดโครงสร้างได้ถูกต้อง**

---

### 🔴 สาเหตุที่ 4: Analysis Steps ไม่ชัดเจนพอ

```
Step 1 — Count first:
Step 2 — For each section in blueprint:
Step 3 — Highlight comments:
Step 4 — Write insights:
```

➡️ **AI ข้าม steps เหล่านี้เพราะไม่มีการบังคับหรือ validation**

---

## แนวทางแก้ไข

### ✅ แก้ไขที่ 1: แยก Blueprint Definition ออกจาก Output Instruction

**ปรับโครงสร้าง Prompt เป็น:**

```markdown
## INPUT DATA

### 1. Blueprint (Analysis Plan)
คุณจะได้รับ blueprint object ที่กำหนดว่าต้องวิเคราะห์อะไร:
{
  "task_intent": "...",
  "sections": [
    {
      "section_id": "s1",
      "section_title": "...",
      "section_type": "bar_chart",
      "what_to_measure": "..."
    }
  ]
}

➡️ **Blueprint คือ INPUT สำหรับการวิเคราะห์**
➡️ **ไม่ใช่สิ่งที่คุณต้อง output กลับมา**

### 2. Raw Data
<posts>{{posts_raw}}</posts>
<comments>{{comments_raw}}</comments>

---

## YOUR JOB: Transform Blueprint + Raw Data → Analysis Report

คุณต้อง output **ANALYSIS REPORT** ในรูปแบบนี้เท่านั้น:

```json
{
  "meta": {
    "task_intent": "copy from blueprint",
    "posts_count": 0,
    "comments_count": 0,
    "analyzed_at": "ISO8601"
  },
  "summary": { ... },
  "posts": [ ... ],
  "sections": [ ... ],
  "highlights": [ ... ],
  "insights": [ ... ]
}
```
```

---

### ✅ แก้ไขที่ 2: เพิ่มตัวอย่าง Output ที่ถูกต้อง

เพิ่มส่วนนี้ใน prompt:

```markdown
## EXAMPLE OUTPUT (ตัวอย่างที่ถูกต้อง)

### Input Blueprint:
{
  "task_intent": "group_comments_by_politician",
  "sections": [
    {
      "section_id": "s1",
      "section_title": "นักการเมืองที่ถูกกล่าวถึง",
      "section_type": "bar_chart",
      "what_to_measure": "count per politician"
    }
  ]
}

### Input Comments:
[
  { "text": "อนุทินทำดีมาก", "from": "user1" },
  { "text": "อนุทินไม่ดี", "from": "user2" },
  { "text": "เสรีพิศุทธ์เก่ง", "from": "user3" }
]

### Expected Output:
{
  "meta": {
    "task_intent": "group_comments_by_politician",
    "posts_count": 1,
    "comments_count": 3,
    "analyzed_at": "2026-06-12T10:30:00Z",
    "data_quality": "good"
  },
  "summary": {
    "one_line": "พบการกล่าวถึงอนุทินมากที่สุด 2 ครั้ง",
    "overall_sentiment": "mixed",
    "confidence_score": 85
  },
  "posts": [
    {
      "post_id": "p1",
      "post_url": "https://facebook.com/...",
      "page_name": "Daily News",
      "comments_analyzed": 3,
      "post_sentiment": "mixed"
    }
  ],
  "sections": [
    {
      "section_id": "s1",
      "section_title": "นักการเมืองที่ถูกกล่าวถึง",
      "section_type": "bar_chart",
      "post_id": "all",
      "items": [
        {
          "item_id": "i1",
          "label": "อนุทิน",
          "value": 2,
          "percent": "67%",
          "sentiment": "mixed",
          "note": "มีทั้งเชิงบวกและเชิงลบ"
        },
        {
          "item_id": "i2",
          "label": "เสรีพิศุทธ์",
          "value": 1,
          "percent": "33%",
          "sentiment": "positive"
        }
      ]
    }
  ],
  "highlights": [
    {
      "post_id": "p1",
      "comment_text": "อนุทินทำดีมาก",
      "reason": "แสดง sentiment เชิงบวกต่อนักการเมือง",
      "sentiment": "positive",
      "tags": "praise,politician",
      "entities": "อนุทิน"
    }
  ],
  "raw_signals": [
    {
      "post_id": "all",
      "signal_key": "total_politicians_mentioned",
      "signal_label": "จำนวนนักการเมืองที่ถูกกล่าวถึง",
      "signal_value": 2,
      "signal_type": "count"
    }
  ],
  "insights": [
    {
      "scope": "post",
      "post_id": "p1",
      "insight_text": "คอมเมนต์ส่วนใหญ่กล่าวถึงอนุทิน มี sentiment แบ่งออกเป็นทั้งเชิงบวกและเชิงลบ"
    }
  ]
}
```
```

---

### ✅ แก้ไขที่ 3: ปรับ RULE 4 ให้รองรับ Nested Data

**เดิม:**
```
RULE 4: Arrays-inside-arrays FORBIDDEN
```

**ใหม่:**
```
RULE 4: Maximum 2 levels of nesting only.
- ✅ Allowed: items: [{label, value, notes: "a,b,c"}]
- ✅ Allowed: sections: [{items: [{...}]}]
- ❌ Forbidden: sections: [{items: [{subitems: [{...}]}]}]
- For complex groupings, use section_note + comma-separated references
```

หรือถ้าต้องการ grouped comments จริงๆ ให้เพิ่ม special case:

```
For section_type "grouped_list", items can have a comments array:
{
  "item_id": "i1",
  "label": "อนุทิน",
  "value": 5,
  "percent": "50%",
  "sentiment": "mixed",
  "comments": [
    {"text": "...", "sentiment": "positive"},
    {"text": "...", "sentiment": "negative"}
  ]
}
```

---

### ✅ แก้ไขที่ 4: เพิ่ม Validation Checklist

เพิ่มท้าย prompt:

```markdown
## PRE-OUTPUT VALIDATION

Before returning your JSON, check:

✓ [ ] Top-level has exactly these fields: meta, summary, posts, metrics, sections, highlights, raw_signals, insights
✓ [ ] meta.posts_count = length of posts array
✓ [ ] meta.comments_count = sum of all comments analyzed
✓ [ ] All section_id in sections match blueprint exactly
✓ [ ] All section_type in sections match blueprint exactly
✓ [ ] Each section has items array (can be empty if no data)
✓ [ ] Each item has: item_id, label, value, percent, sentiment
✓ [ ] All percent values are in "XX%" format
✓ [ ] All sentiment values are exactly: positive | neutral | negative
✓ [ ] highlights array has max 5 items
✓ [ ] All comment_text in highlights are verbatim from input (not fabricated)
✓ [ ] insights array has at least 1 cross_post insight

If ANY checkbox is unchecked → FIX before output
```

---

### ✅ แก้ไขที่ 5: ปรับ Analysis Steps ให้ Explicit

**เดิม:**
```
Step 1 — Count first:
Step 2 — For each section in blueprint:
...
```

**ใหม่:**
```
## ANALYSIS PROCEDURE (MANDATORY)

Execute these steps IN ORDER. Output progress after each step.

### Step 1: Initialize Meta
```json
{
  "meta": {
    "posts_count": COUNT_POSTS,
    "comments_count": COUNT_ALL_COMMENTS,
    "analyzed_at": "ISO8601_NOW"
  }
}
```

### Step 2: Build Posts Array
For each post in input:
```json
{
  "post_id": "p1",
  "post_url": "COPY_VERBATIM",
  "page_name": "EXTRACT",
  "comments_analyzed": COUNT_FOR_THIS_POST,
  "post_sentiment": "CALCULATE"
}
```

### Step 3: Process Each Section from Blueprint
For section_id in blueprint.sections:
  a. Read section.what_to_measure
  b. Extract matching data from raw comments
  c. Build items array:
     ```json
     {
       "item_id": "i{N}",
       "label": "CATEGORY_NAME",
       "value": COUNT_OR_SCORE,
       "percent": "CALCULATE_PERCENT%",
       "sentiment": "AGGREGATE_SENTIMENT"
     }
     ```
  d. If no data found → items: [], section_note: "ไม่พบข้อมูล"

### Step 4: Select Highlights
Pick TOP 5 comments that:
- Best represent task_intent
- Have high engagement (likes/replies)
- Show clear sentiment
- Cover diverse perspectives

**CRITICAL:** Use verbatim text from input — never paraphrase

### Step 5: Write Insights
- Per post (scope: "post"): 2-3 sentences Thai
- Cross-post (scope: "cross_post"): 1-2 sentences overall pattern

### Step 6: Final Assembly
Combine all parts into final JSON matching ENVELOPE SCHEMA
```

---

## สรุปการแก้ไข

| ปัญหา | แนวทางแก้ไข | Priority |
|-------|-------------|----------|
| Output ผิด structure | แยก blueprint definition ชัดเจน + เพิ่มตัวอย่าง | 🔴 Critical |
| ไม่มี required fields | เพิ่ม validation checklist | 🔴 Critical |
| sections.items ผิด | เพิ่มตัวอย่างที่ถูกต้อง | 🔴 Critical |
| RULE 4 ขัดแย้ง | ปรับให้รองรับ 2-level nesting | 🟡 High |
| ข้าม analysis steps | ทำ steps เป็น mandatory procedure | 🟡 High |
| ไม่มี highlights/insights | เพิ่มใน validation checklist | 🟢 Medium |

---

## Revised Prompt Template

```markdown
# Thai Facebook Social Media Analyst

You are analyzing Facebook posts and comments to produce a structured JSON report.

---

## INPUT

### 1. Blueprint (Analysis Plan)
You will receive a blueprint object defining WHAT to analyze:
- task_intent: purpose of analysis
- sections: what measurements to perform

**IMPORTANT:** The blueprint is your INPUT, not your OUTPUT.

### 2. Raw Data
<posts>{{posts_raw}}</posts>
<comments>{{comments_raw}}</comments>

---

## YOUR JOB

Transform Blueprint + Raw Data → Analysis Report (JSON)

---

## OUTPUT SCHEMA (STRICT)

```json
{
  "meta": {
    "task_intent": "string",
    "posts_count": 0,
    "comments_count": 0,
    "analyzed_at": "ISO8601",
    "data_quality": "good|partial|poor"
  },
  "summary": {
    "one_line": "Thai 1 sentence",
    "key_finding": "string",
    "overall_sentiment": "positive|neutral|negative|mixed",
    "confidence_score": 0
  },
  "posts": [
    {
      "post_id": "p1",
      "post_url": "verbatim from input",
      "page_name": "string",
      "comments_analyzed": 0,
      "post_sentiment": "positive|neutral|negative"
    }
  ],
  "sections": [
    {
      "section_id": "s1",
      "section_title": "Thai from blueprint",
      "section_type": "bar_chart|pie_chart|table|list|scorecard",
      "post_id": "p1|all",
      "items": [
        {
          "item_id": "i1",
          "label": "Thai",
          "value": 0,
          "percent": "XX%",
          "sentiment": "positive|neutral|negative",
          "note": "optional Thai"
        }
      ]
    }
  ],
  "highlights": [
    {
      "post_id": "p1",
      "comment_text": "verbatim only",
      "reason": "Thai",
      "sentiment": "positive|neutral|negative",
      "tags": "comma,separated",
      "entities": "comma,separated"
    }
  ],
  "raw_signals": [
    {
      "post_id": "p1|all",
      "signal_key": "snake_case",
      "signal_label": "Thai",
      "signal_value": 0,
      "signal_type": "count|score|label|percent"
    }
  ],
  "insights": [
    {
      "scope": "post|cross_post",
      "post_id": "p1|null",
      "insight_text": "Thai 2-3 sentences"
    }
  ]
}
```

---

## EXAMPLE (ตัวอย่างที่ถูกต้อง)

[ใส่ตัวอย่างตามข้างบน]

---

## VALIDATION BEFORE OUTPUT

✓ All required top-level fields present
✓ meta.posts_count matches posts.length
✓ Each section has items array (can be empty)
✓ Each item has required fields: item_id, label, value, percent, sentiment
✓ All percent in "XX%" format
✓ All sentiment in exact: positive|neutral|negative
✓ highlights max 5 items
✓ All comment_text verbatim from input

---

## OUTPUT RULES

1. Return ONLY valid JSON
2. No explanation before/after
3. sentiment: exactly positive|neutral|negative
4. percent: "XX%" string format
5. Never fabricate comment text
6. Maximum 2 nesting levels
```
