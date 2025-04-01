# 📊 PGIA Database Schema (Optimized)

This schema follows best practices in naming conventions, normalization, and clarity. Relationships are structured for easy use with Supabase, Postgres, ORMs, and LLM integrations.

---

## 🧍 clients

Core client profiles (businesses being insured)

| Column             | Type      | Description                          |
|--------------------|-----------|--------------------------------------|
| id                 | UUID (PK) | Unique client ID                     |
| company_name       | Text      | Registered business name             |
| named_insured      | Text      | Insured entity or individual         |
| address            | Text      | Primary address                      |
| email              | Text      | Primary email                        |
| principal_owners   | Text[]    | Names of key owners/directors        |
| operations         | Text      | What the business does               |
| licensing_required | Boolean   | Whether the business needs a license |
| revenue_estimate   | Numeric   | Estimated annual revenue             |
| payroll_estimate   | Numeric   | Estimated annual payroll             |
| employee_count     | Integer   | Number of employees                  |
| years_in_business  | Integer   | Years since incorporation            |
| linkedin_url       | Text      | Optional social profile              |
| x_url              | Text      | Twitter/X profile                    |
| facebook_url       | Text      | Facebook profile                     |
| street_view_image  | Text      | Image URL or blob ref                |
| created_at         | Timestamp | Record creation date                 |

---

## 🏢 carriers

List of carriers the platform can work with

| Column         | Type      | Description                   |
|----------------|-----------|-------------------------------|
| id             | UUID (PK) | Unique carrier ID             |
| name           | Text      | Carrier or MGA name           |
| region         | Text[]    | Provinces of operation        |
| contact_email  | Text      | Submission email              |
| notes          | Text      | Appetite or quirks            |
| uses_portal    | Boolean   | True if submission via web    |
| supports_api   | Boolean   | Can receive API submissions   |
| created_at     | Timestamp | When added to system          |

---

## 🧾 coverages

Master list of coverage types

| Column       | Type      | Description              |
|--------------|-----------|--------------------------|
| id           | UUID (PK) | Unique coverage ID       |
| name         | Text      | e.g., "Directors & Officers" |
| type_id      | UUID (FK) | FK to coverage_types     |
| description  | Text      | Optional details          |

---

## 🏷️ coverage_types

Categories of insurance products

| Column       | Type      | Description          |
|--------------|-----------|----------------------|
| id           | UUID (PK) | Unique category ID   |
| name         | Text      | e.g., Liability, Property, Specialty |

---

## 📦 carrier_coverages

Available products and services offered by each carrier

| Column       | Type      | Description                          |
|--------------|-----------|--------------------------------------|
| id           | UUID (PK) | Unique row ID                        |
| carrier_id   | UUID (FK) | FK to carriers                       |
| coverage_id  | UUID (FK) | FK to coverages                      |
| appetite     | Text      | Appetite notes or targeting info     |
| min_premium  | Numeric   | Minimum written premium requirement  |

---

## 🧠 client_coverages

Requested or active coverages per client

| Column       | Type      | Description                 |
|--------------|-----------|-----------------------------|
| id           | UUID (PK) | Unique row ID               |
| client_id    | UUID (FK) | FK to clients               |
| coverage_id  | UUID (FK) | FK to coverages             |
| status       | Text      | "requested", "quoted", "bound" |

---

## 📄 client_documents

Uploaded PDFs, leases, COIs, etc.

| Column         | Type      | Description                     |
|----------------|-----------|---------------------------------|
| id             | UUID (PK) | Unique doc ID                   |
| client_id      | UUID (FK) | FK to clients                   |
| name           | Text      | File name or label              |
| type_id        | UUID (FK) | FK to document_types            |
| file_url       | Text      | Supabase storage or blob link   |
| created_at     | Timestamp | Upload time                     |

---

## 📂 document_types

Tagging system for document uploads

| Column     | Type      | Description               |
|------------|-----------|---------------------------|
| id         | UUID (PK) | Unique doc type ID        |
| name       | Text      | e.g., "Lease", "COI", "Loss Run" |

---

## 📬 submissions

Outbound quote submission log

| Column         | Type      | Description                        |
|----------------|-----------|------------------------------------|
| id             | UUID (PK) | Unique ID                          |
| client_id      | UUID (FK) | FK to clients                      |
| carrier_id     | UUID (FK) | FK to carriers                     |
| submission_pdf | Text      | Link to submission file            |
| created_at     | Timestamp | Sent time                          |

---

## 💬 quotes

Parsed or received quotes

| Column         | Type      | Description                        |
|----------------|-----------|------------------------------------|
| id             | UUID (PK) | Quote ID                           |
| client_id      | UUID (FK) | FK to clients                      |
| carrier_id     | UUID (FK) | FK to carriers                     |
| submission_id  | UUID (FK) | FK to submissions                  |
| total_premium  | Numeric   | Total quoted premium               |
| status         | Text      | "received", "shortlisted", etc.    |
| quote_pdf      | Text      | Link to original PDF               |
| created_at     | Timestamp | When received                      |

---

## 🔎 quote_fields

Extracted data points from quotes

| Column       | Type      | Description                    |
|--------------|-----------|--------------------------------|
| id           | UUID (PK) | Unique ID                      |
| quote_id     | UUID (FK) | FK to quotes                   |
| field_name   | Text      | e.g., "TLL", "Deductible"      |
| field_value  | Text      | Parsed value                   |

---

## 🔁 renewals

Renewal tracking per bound policy

| Column         | Type      | Description                     |
|----------------|-----------|---------------------------------|
| id             | UUID (PK) | Unique row ID                   |
| client_id      | UUID (FK) | FK to clients                   |
| coverage_id    | UUID (FK) | FK to coverages                 |
| expiry_date    | Date      | When policy expires             |
| reminders_sent | Boolean   | Whether reminders were issued   |
| last_contacted | Timestamp | Last touchpoint with client     |
