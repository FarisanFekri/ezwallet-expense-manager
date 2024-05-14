# Requirements Document - future EZWallet

Date: 27/04/2023

Version: V2 - description of EZWallet in FUTURE form (as proposed by the team)

| Version number | Change                                                               |
| -------------- | :------------------------------------------------------------------- |
| 0.1            | Adding sketch for stakeholders, diagrams and functional requirements |
| 0.2            | Adding glossary                                                      |
| 0.3            | Adding system and deployment diagram                                 |
| 0.4            | Adding use cases                                                     |
| 0.5            | Adding use cases diagram                                             |
| 0.6            | Finishing use case and use case diagram                              |
| 0.7            | Finishing diagrams                                                   |
| 0.8            | Minor Fixes                                                          |
| 1              | Final Review                                                         |

# Contents

- [Informal description](#informal-description)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
  - [Context Diagram](#context-diagram)
  - [Interfaces](#interfaces)
- [Stories and personas](#stories-and-personas)
- [Functional and non functional requirements](#functional-and-non-functional-requirements)
  - [Functional Requirements](#functional-requirements)
  - [Non functional requirements](#non-functional-requirements)
- [Use case diagram and use cases](#use-case-diagram-and-use-cases)
  - [Use case diagram](#use-case-diagram)
  - [Use cases](#use-cases) + [Relevant scenarios](#relevant-scenarios)
- [Glossary](#glossary)
- [System design](#system-design)
- [Deployment diagram](#deployment-diagram)

# Informal description

EZWallet (read EaSy Wallet) is a software application designed to help individuals and families keep track of their expenses. Users can enter and categorize their expenses, allowing them to quickly see where their money is going. EZWallet is a powerful tool for those looking to take control of their finances and make informed decisions about their spending.

### Business Model
EZWallet is a free app but in order to maintain itself it provides ads to generate introits.

# Stakeholders

| Stakeholder name    |                                  Description                                  |
| ------------------- | :---------------------------------------------------------------------------: |
| User                |                       Standard user of the application                        |
| Group Administrator |     Special user with advance functionalities who manage group of people      |
| IT Manager          |       Administrator who maganes the ads and all the app, can ban users        |
| DB Administrator    |                      Database manager of the application                      |
| COO                 | The chief operating officer who manages operational functions of the business |
| Ads service         |                          Service which provides ads                           |

## Context Diagram

```plantuml
actor "User" as a1
actor "DB Administrator" as a2
actor "COO" as a3
actor "Group Administrator" as a4
actor "IT Manager" as a5
actor "Ads Service" as a6

a1 -- (EZWallet)
a2 -- (EZWallet)
a3 -- (EZWallet)
a1 <|-- a4
(EZWallet) -- a5
(EZWallet) -- a6
```

## Interfaces

| Actor               | Logical Interface |                       Physical Interface |
| ------------------- | :---------------: | ---------------------------------------: |
| User                | Web & Mobile GUI  | Screen, Mouse and Keyboard / Touchscreen |
| Group Administrator | Web & Mobile GUI  | Screen, Mouse and Keyboard / Touchscreen |
| DB Administrator    |     DBMS GUI      |               Screen, Mouse and Keyboard |
| COO                 | Web & Mobile GUI  | Screen, Mouse and Keyboard / Touchscreen |
| IT Manager          |     Terminal      |               Screen, Mouse and Keyboard |

# Stories and personas

#### Persona 1

Female, 26 years old, employee with medium income, single and no children.
**Story**: she has recenetly started working and wants to keep an eye on her expenses, in particular food, public transport and entertainment.

#### Persona 2

Male, 45 years old, businessman with high income, married with 2 children.
**Story**: he has a small company and he has to observe the company's expenses like the rent payment for offices, work equipment and journey transactions.

#### Persona 3

Female, 38 years old, unemployed, married with 3 children.
**Story**: she has to monitor her family expenses in a simple and undemanding way; moreover, she wants to divide her everyday expences like rent or food from school materials and activities of her children.

#### Persona 4

Male, 22 years old, student, single and no children.
**Story**: he is a university student who wants to handle his budget; he needs to organize his expenses not only for universitary matters, food, rent/bills but also for personal interests like going out with his friends. In this way he can trace his transactions and find different ways to cut off useless expenses in order to save some money. therefore, for this goal he is obligated to set limits on his expenses from different categories.

#### Persona 5

Male, 36 years old, manager of a company.
**Story**: he manages a group of people working on a project for the company. He has to keep the employees organized and plus, keeps up with their expenses related to the project. For this aim, he needs Group Administrator functionalities.

# Functional and non functional requirements

## Functional Requirements

| ID      |                                     Description                                      |
| ------- | :----------------------------------------------------------------------------------: |
| **FR1** |                            **Authorize and Authenticate**                            |
| FR1.1   |                                 Register an account                                  |
| FR1.2   |                                Log in into an account                                |
| FR1.3   |                                Log out of the account                                |
| **FR2** |                                   **Manage Users**                                   |
| FR2.1   |                List all users credentials (Username, Email, Password)                |
| FR2.2   |              Retreive personal credentials (Username, Email, Password)               |
| FR2.3   |                                     Create group                                     |
| FR2.4   |                                      Join group                                      |
| FR2.5   |                                 List users in group                                  |
| FR2.6   |                                     Delete users                                     |
| **FR3** |                                **Manage Categories**                                 |
| FR3.1   |                                    Add a category                                    |
| FR3.2   |                                  Delete a category                                   |
| FR3.3   |                                   Edit a category                                    |
| FR3.4   |                             Get transactions by category                             |
| FR3.5   |                                 List all categories                                  |
| **FR4** |                               **Manage Transactions**                                |
| FR4.1   |                                  Add a transaction                                   |
| FR4.2   |                                 Delete a transaction                                 |
| FR4.3   |                                  Edit a transaction                                  |
| FR4.4   |                           Sort transactions by amount/date                           |
| FR4.5   |                            List all personal transactions                            |
| FR4.6   |                      List all transactions with category labels                      |
| FR4.7   |                    List transactions of all the user in the group                    |
| **FR5** |                                 **Manage Analisys**                                  |
| FR5.1   |            Create a report based on a period of time and/or on a category            |
| FR5.2   |                                    Export report                                     |
| FR5.3   |                                 Create group report                                  |
| **FR6** |                                **Manage Thresholds**                                 |
| FR6.1   |       Set a threshold on transactions amounts for a category or period of time       |
| FR6.2   | Receive an alert when adding a transaction results in exceeding 90% of the threshold |
| FR6.3   |                    Set threshold for a specific user in the group                    |
| **FR7** |                                  **Advertisement**                                   |
| FR7.1   |                                   Show ads banners                                   |

## Access Rights Table

Note: only relevant functionalities shown.

| Function | Group Administrator |  User   | IT Manager |
| -------- | :-----------------: | :-----: | :--------: |
| FR2.1    |         No          |   No    |  **Yes**   |
| FR2.3    |         No          | **Yes** |     No     |
| FR2.4    |         No          | **Yes** |     No     |
| FR2.5    |       **Yes**       |   No    |     No     |
| FR2.6    |         No          |   No    |  **Yes**   |
| FR4.7    |       **Yes**       |   No    |     No     |
| FR5.3    |       **Yes**       |   No    |     No     |
| FR6.3    |       **Yes**       |   No    |     No     |

## Non Functional Requirements

| ID   |      Type       |                                                 Description                                                 | Refers to |
| ---- | :-------------: | :---------------------------------------------------------------------------------------------------------: | --------: |
| NFR1 |   Portability   |               The application should be developed and deployed for iOS, Android and Web usage               |   All FRs |
| NFR2 |   Efficiency    |                             All functions should complete in under 0.5 seconds                              |   All FRs |
| NFR3 |    Usability    |                       Users should not need specific training to use the application                        |   All FRs |
| NFR4 |    Security     |                                   The application should comply with GDPR                                   |   All FRs |
| NFR5 |    Security     | All information about the users and their inserted data should not become public outside of the application |   All FRs |
| NFR6 | Maintainability |                The needed time to fix/add/remove a function should be under 20 person-hours                 |   All FRs |

# Use case diagram and use cases

## Use case diagram

```plantuml
left to right direction
scale 3/4

actor "User" as a1
actor "Group Administrator" as a2
actor "IT Manager" as a3
actor "Ads Service" as a4

rectangle EZWallet {
  usecase "Authorize and Authenticate" as UC1
    usecase "User Registration" as UC1_1
    usecase "User Login" as UC1_2
    usecase "User Logout" as UC1_3
  usecase "Manage Users" as UC2
    usecase "Get All Users Credentials" as UC2_1
    usecase "Get Personal User Credentials" as UC2_2
	usecase "Create Group" as UC2_3
	usecase "Join Group" as UC2_5
	usecase "List Group Users" as UC2_6
	usecase "Delete Users" as UC2_4
  usecase "Manage Categories" as UC3
    usecase "Create Category" as UC3_1
    usecase "List Categories" as UC3_2
	usecase "Delete Category" as UC3_3
	usecase "Edit Category" as UC3_4
	usecase "Get Transactions by category" as UC3_5
  usecase "Manage Transactions" as UC4
    usecase "Create Transaction" as UC4_1
    usecase "List Personal Transactions" as UC4_2
    usecase "Delete Transaction" as UC4_3
    usecase "List Transaction with Category Label" as UC4_4
	usecase "Edit Transaction" as UC4_5
    usecase "Sort Transactions" as UC4_6
	usecase "List Group Transactions" as UC4_7
  usecase "Manage Analisys" as UC5
	usecase "Create Report" as UC5_1
	usecase "Export Report" as UC5_2
	usecase "Create Group Report" as UC5_3
  usecase "Manage Thresholds" as UC6
    usecase "Create Threshold" as UC6_1
	usecase "Alert Threshold" as UC6_2
	usecase "Set Threshold for user in the Group" as UC6_3
  usecase "Advertisement" as UC7
    usecase "Show Ads" as UC7_1
}

a1 <|-- a2

a1 -- UC1
a1 -- UC2
a1 -- UC3
a1 -- UC4
a1 -- UC5
a1 -- UC6

a3 -- UC2_1
a3 -- UC2_4

a2 -- UC2_6
a2 -- UC4_7
a2 -- UC5_3
a2 -- UC6_3

a4 -- UC7

UC1 ..> UC1_1 : "Include"
UC1 ..> UC1_3 : "Include"
UC1 ..> UC1_2 : "Include"

UC2 ..> UC2_2 : "Include"
UC2 ..> UC2_3 : "Include"
UC2 ..> UC2_5 : "Include"

UC3 ..> UC3_1 : "Include"
UC3 ..> UC3_2 : "Include"
UC3 ..> UC3_3 : "Include"
UC3 ..> UC3_4 : "Include"
UC3 ..> UC3_5 : "Include"

UC4 ..> UC4_1 : "Include"
UC4 ..> UC4_2 : "Include"
UC4 ..> UC4_3 : "Include"
UC4_2 <|-- UC4_4
UC4 ..> UC4_5 : "Include"
UC4 ..> UC4_6 : "Include"

UC5 ..> UC5_1 : "Include"
UC5_1 <.. UC5_2 : "Extends"

UC6 ..> UC6_1 : "Include"
UC6_1 ..> UC6_2 : "Include"

UC7 ..> UC7_1 : "Include"
```

### Use case 1, UC1 - User Registration

| Actors Involved  |                 User                  |
| ---------------- | :-----------------------------------: |
| Precondition     |     User doesn't have an account      |
| Post condition   |          User is registered           |
| Nominal Scenario |   User account registration via web   |
| Variants         | User account registration via mobile  |
| Exceptions       | User inserts email already registered |

##### Scenario 1.1

| Scenario 1.1   |   User account registration via web   |
| -------------- | :-----------------------------------: |
| Precondition   |         User goes to web site         |
| Post condition |          User is registered           |
| Step#          |              Description              |
| 1              | User clicks on register account link  |
| 2              |   User completes registration form    |
| 3              | System validates email (no duplicate) |
| 4              |          Server stores data           |
| 5              | System brings user to login dashboard |

##### Scenario 1.2

| Scenario 1.2   | User account registration via mobile  |
| -------------- | :-----------------------------------: |
| Precondition   |          User downloads app           |
| Post condition |          User is registered           |
| Step#          |              Description              |
| 1              |            User opens app             |
| 2              |  Users goes to registration section   |
| 3              |   User completes registration form    |
| 4              | System validates email (no duplicate) |
| 5              |          Server stores data           |
| 6              | System brings user to login dashboard |

##### Scenario 1.3

| Scenario 1.3   | User insert email already registered |
| -------------- | :----------------------------------: |
| Precondition   |     User is on registration form     |
| Post condition |     User fails to create account     |
| Step#          |             Description              |
| 1              |     User fills registration form     |
| 2              |        System validates email        |
| 3              |  System detects email already used   |
| 4              |       App shows an error popup       |

### Use case 2, UC2 - User Login

| Actors Involved  |                         User                          |
| ---------------- | :---------------------------------------------------: |
| Precondition     |                  User has an account                  |
| Post condition   |          User is logged in and authenticated          |
| Nominal Scenario |                  User login via web                   |
| Variants         |                 User login via mobile                 |
| Exceptions       | User inserts wrong email, User inserts wrong password |

##### Scenario 2.1

| Scenario 2.1   |              User login via web               |
| -------------- | :-------------------------------------------: |
| Precondition   |              User is registered               |
| Post condition |             User is authenticated             |
| Step#          |                  Description                  |
| 1              |               User goes to site               |
| 2              | User fills login form (username and password) |
| 3              |             User clicks on log in             |
| 4              |           System checks credentials           |
| 5              |     System brings user to main dashboard      |

##### Scenario 2.2

| Scenario 2.2   |             User login via mobile             |
| -------------- | :-------------------------------------------: |
| Precondition   |              User is registered               |
| Post condition |             User is authenticated             |
| Step#          |                  Description                  |
| 1              |                User starts app                |
| 2              | User fills login form (username and password) |
| 3              |             User clicks on log in             |
| 4              |           System checks credentials           |
| 5              |     System brings user to main dashboard      |

##### Scenario 2.3

| Scenario 2.3   |           User inserts wrong email            |
| -------------- | :-------------------------------------------: |
| Precondition   |     User is registered and in login form      |
| Post condition |           User isn't authenticated            |
| Step#          |                  Description                  |
| 1              | User fills login form (username and password) |
| 2              |             User clicks on log in             |
| 3              |           System checks credentials           |
| 4              |    System detects an email not registered     |
| 5              |           App shows an error popup            |

##### Scenario 2.4

| Scenario 2.4   |           User inserts wrong password            |
| -------------- | :----------------------------------------------: |
| Precondition   |       User is registered and in login form       |
| Post condition |             User isn't authenticated             |
| Step#          |                   Description                    |
| 1              |  User fills login form (username and password)   |
| 2              |              User clicks on log in               |
| 3              |            System checks credentials             |
| 4              | System detects a password not matching any email |
| 5              |             App shows an error popup             |

### Use case 3, UC3 - User Logout

| Actors Involved  |        User        |
| ---------------- | :----------------: |
| Precondition     | User is logged in  |
| Post condition   | User is logged out |
| Nominal Scenario |    User logout     |
| Variants         |                    |
| Exceptions       |                    |

##### Scenario 3.1

| Scenario 3.1   |               Log out               |
| -------------- | :---------------------------------: |
| Precondition   |          User is logged in          |
| Post condition |         User is logged out          |
| Step#          |             Description             |
| 1              |        User goes to profile         |
| 2              |     User presses logout button      |
| 3              | The system goes to the login screen |

### Use case 4, UC4 - Get All Users Credentials

| Actors Involved  |            IT Manager            |
| ---------------- | :------------------------------: |
| Precondition     | IT Manager is logged in terminal |
| Post condition   | IT Manager obtains list of users |
| Nominal Scenario |  Get list of users credentials   |
| Variants         |                                  |
| Exceptions       |                                  |

##### Scenario 4.1

| Scenario 4.1   |     Get list of users credentials      |
| -------------- | :------------------------------------: |
| Precondition   |    IT Manager is logged in terminal    |
| Post condition |  IT Manager has got list of all users  |
| Step#          |              Description               |
| 1              | IT Manager sends get users query at DB |
| 2              |         DB returns the result          |

### Use case 5, UC5 - Get Personal User Credentials

| Actors Involved  |               User                |
| ---------------- | :-------------------------------: |
| Precondition     |          User is logged           |
| Post condition   | User has his personal credentials |
| Nominal Scenario |     Get personal credentials      |
| Variants         |                                   |
| Exceptions       |                                   |

##### Scenario 5.1

| Scenario 5.1   |    Get personal credentials    |
| -------------- | :----------------------------: |
| Precondition   |         User is logged         |
| Post condition | User sees personal credentials |
| Step#          |          Description           |
| 1              | User clicks on profile section |

### Use case 6, UC6 - Create Group

| Actors Involved  |                         User                         |
| ---------------- | :--------------------------------------------------: |
| Precondition     |       User is logged and in profile dashboard        |
| Post condition   | User creates a group and becomes Group Administrator |
| Nominal Scenario |                 User creates a group                 |
| Variants         |                                                      |
| Exceptions       |                                                      |

##### Scenario 6.1 Join Group

| Scenario 6.1   |                 User creates a group                 |
| -------------- | :--------------------------------------------------: |
| Precondition   |       User is logged and in profile dashboard        |
| Post condition | User creates a group and becomes Group Administrator |
| Step#          |                     Description                      |
| 1              |             User clicks on create group              |
| 2              |        System brings user to group dashboard         |

### Use case 7, UC7 - Join Group

| Actors Involved  |               User               |
| ---------------- | :------------------------------: |
| Precondition     | User receives an invitation link |
| Post condition   |       User enters a group        |
| Nominal Scenario |   User enters a group (logged)   |
| Variants         | User enters a group (not logged) |
| Exceptions       |     User already in a group      |

##### Scenario 7.1

| Scenario 7.1   |          User enters a group (logged)          |
| -------------- | :--------------------------------------------: |
| Precondition   | User receives an invitation link and is logged |
| Post condition |             User enters in a group             |
| Step#          |                  Description                   |
| 1              |              User clicks on link               |
| 2              |     System brings user to first dashboard      |
| 3              |           System show success popup            |

##### Scenario 7.2

| Scenario 7.2   |         User enters a group (not logged)          |
| -------------- | :-----------------------------------------------: |
| Precondition   | User receives an invitation link and isn't logged |
| Post condition |              User enters in a group               |
| Step#          |                    Description                    |
| 1              |                User clicks on link                |
| 2              |       System brings user to login dashboard       |
| 3              |                   User logs in                    |
| 4              |       System brings user to first dashboard       |
| 5              |             System show success popup             |

##### Scenario 7.3

| Scenario 7.3   |            User already in a group             |
| -------------- | :--------------------------------------------: |
| Precondition   | User receives an invitation link and is logged |
| Post condition |         User doesn't enter in a group          |
| Step#          |                  Description                   |
| 1              |              User clicks on link               |
| 2              |     System brings user to first dashboard      |
| 3              |            System show error popup             |

### Use case 8, UC8 - List Group Users

| Actors Involved  |              Group Administrator               |
| ---------------- | :--------------------------------------------: |
| Precondition     |         Group Administrator is logged          |
| Post condition   | Group Administrator has list of users in group |
| Nominal Scenario | Group Administrator has list of users in group |
| Variants         |                                                |
| Exceptions       |                                                |

##### Scenario 8.1

| Scenario 8.1   | Group Administrator has list of users in group |
| -------------- | :--------------------------------------------: |
| Precondition   |         Group Administrator is logged          |
| Post condition | Group Administrator has list of users in group |
| Step#          |                  Description                   |
| 1              |  Group Administrator goes on group dashboard   |

### Use case 9, UC8 - Delete Users

| Actors Involved  |            IT Manager            |
| ---------------- | :------------------------------: |
| Precondition     | IT Manager is logged in terminal |
| Post condition   |    IT Manager deleted a user     |
| Nominal Scenario |          Delete a user           |
| Variants         |                                  |
| Exceptions       |                                  |

##### Scenario 9.1

| Scenario 9.1   |              Delete a user               |
| -------------- | :--------------------------------------: |
| Precondition   |     IT Manager is logged in terminal     |
| Post condition |        IT Manager deletes a user         |
| Step#          |               Description                |
| 1              | IT Manager sends delete user query at DB |
| 2              |          DB returns the result           |

### Use case 10, UC10 - Create Category

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |          User added a category          |
| Nominal Scenario |           User adds category            |
| Variants         |                                         |
| Exceptions       |                                         |

##### Scenario 10.1

| Scenario 10.1  |                  User adds category                  |
| -------------- | :--------------------------------------------------: |
| Precondition   |       User is logged and in profile dashboard        |
| Post condition |                User added a category                 |
| Step#          |                     Description                      |
| 1              |             User clicks on edit category             |
| 2              |           User clicks on add new category            |
| 3              |                   User fills form                    |
| 4              |           System stores on DB the category           |
| 5              | App gives alert about transaction added successfully |

### Use case 11, UC11 - Delete Category

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |         User deleted a category         |
| Nominal Scenario |          User deletes category          |
| Variants         |                                         |
| Exceptions       |                                         |

##### Scenario 11.1

| Scenario 11.1  |                     User deletes category                      |
| -------------- | :------------------------------------------------------------: |
| Precondition   |            User is logged and in profile dashboard             |
| Post condition |                    User deleted a category                     |
| Step#          |                          Description                           |
| 1              |                  User clicks on edit category                  |
| 2              | User clicks on hamburger button of category he wants to delete |
| 3              |                     User clicks on delete                      |
| 4              |     System gives alert if user is sure he wants to delete      |
| 5              |         If no user returns to edit category dashboard          |
| 6              |              If yes selected category is deleted               |

### Use case 12, UC12 - Edit Category

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |         User edited a category          |
| Nominal Scenario |          User edits a category          |
| Variants         |                                         |
| Exceptions       |                                         |

##### Scenario 12.1

| Scenario 12.1  |                    User edits a category                     |
| -------------- | :----------------------------------------------------------: |
| Precondition   |           User is logged and in profile dashboard            |
| Post condition |                    User edited a category                    |
| Step#          |                         Description                          |
| 1              |                 User clicks on edit category                 |
| 2              | User clicks on hamburger button of category he wants to edit |
| 3              |                     User clicks on edit                      |
| 4              |              User changes form he wants to edit              |
| 5              |                     User clicks on done                      |

### Use case 13, UC13 - Get Transactions by Category

| Actors Involved  |                         User                          |
| ---------------- | :---------------------------------------------------: |
| Precondition     |                    User is logged                     |
| Post condition   | User has the list of transaction of selected category |
| Nominal Scenario |             Get Transactions by category              |
| Variants         |                                                       |
| Exceptions       |                                                       |

##### Scenario 13.1

| Scenario 13.1  |                     Get Transaction by categorys                      |
| -------------- | :-------------------------------------------------------------------: |
| Precondition   |                            User is logged                             |
| Post condition |         User has the list of transaction of selected category         |
| Step#          |                              Description                              |
| 1              |                      User is in first dashboard                       |
| 2              |        User clicks on the icon of the category of his interest        |
| 3              | System shows the list of transactions for that category in the screen |

### Use case 14, UC14 - List Categories

| Actors Involved  |              User               |
| ---------------- | :-----------------------------: |
| Precondition     |         User is logged          |
| Post condition   | User has the list of categories |
| Nominal Scenario |       List all categories       |
| Variants         |                                 |
| Exceptions       |                                 |

##### Scenario 14.1

| Scenario 14.1  |                List all categories                |
| -------------- | :-----------------------------------------------: |
| Precondition   |                  User is logged                   |
| Post condition |          User has the list of categories          |
| Step#          |                    Description                    |
| 1              |            User is in first dashboard             |
| 2              | System shows the list of categories in the screen |

### Use case 15, UC15 - Create Transaction

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |        User added a transaction         |
| Nominal Scenario |     User adds a transaction via web     |
| Variants         |   User adds a transaction via mobile    |
| Exceptions       |                                         |

##### Scenario 15.1

| Scenario 15.1  |             User adds a transaction via web             |
| -------------- | :-----------------------------------------------------: |
| Precondition   |         User is logged and in profile dashboard         |
| Post condition |                User added a transaction                 |
| Step#          |                       Description                       |
| 1              |             User clicks on edit transaction             |
| 2              |           User clicks on add new transaction            |
| 3              |                     User fills form                     |
| 4              |           System stores on DB the transaction           |
| 5              | System gives alert about transaction added successfully |

##### Scenario 15.2

| Scenario 15.2  |           User adds a transaction via mobile            |
| -------------- | :-----------------------------------------------------: |
| Precondition   |         User is logged and in profile dashboard         |
| Post condition |                User added a transaction                 |
| Step#          |                       Description                       |
| 1              |             User clicks on the plus button              |
| 2              |                     User fills form                     |
| 3              |           System stores on DB the transaction           |
| 4              | System gives alert about transaction added successfully |

### Use case 16, UC16 - Delete Transaction

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |       User deleted a transaction        |
| Nominal Scenario |   User deletes a transaction via web    |
| Variants         |  User deletes a transaction via mobile  |
| Exceptions       |                                         |

##### Scenario 16.1

| Scenario 16.1  |                User deletes a transaction via web                 |
| -------------- | :---------------------------------------------------------------: |
| Precondition   |              User is logged and in profile dashboard              |
| Post condition |                      User deleted an expense                      |
| Step#          |                            Description                            |
| 1              |                  User clicks on edit transaction                  |
| 2              | User clicks on hamburger button of transaction he wants to delete |
| 3              |                       User clicks on delete                       |
| 4              |       System gives alert if user is sure he wants to delete       |
| 5              |         If no user returns to edit transaction dashboard          |
| 6              |              If yes selected transaction is deleted               |

##### Scenario 16.2

| Scenario 16.2  |              User deletes a transaction via mobile              |
| -------------- | :-------------------------------------------------------------: |
| Precondition   |             User is logged and in profile dashboard             |
| Post condition |                     User deleted an expense                     |
| Step#          |                           Description                           |
| 1              |        User clicks on the transaction he wants to delete        |
| 2              | User clicks on trash icon of the transaction he wants to delete |
| 3              |      System gives alert if user is sure he wants to delete      |
| 4              |        If no user returns to edit transaction dashboard         |
| 5              |             If yes selected transaction is deleted              |

### Use case 17, UC17 - Edit Transaction

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |        User edited a transaction        |
| Nominal Scenario |        User edits a transaction         |
| Variants         |                                         |
| Exceptions       |                                         |

##### Scenario 17.1

| Scenario 17.1  |                    User edits a transaction                     |
| -------------- | :-------------------------------------------------------------: |
| Precondition   |             User is logged and in profile dashboard             |
| Post condition |                    User edits a transaction                     |
| Step#          |                           Description                           |
| 1              |                 User clicks on edit transaction                 |
| 2              | User clicks on hamburger button of transaction he wants to edit |
| 3              |                       User clicks on edit                       |
| 4              |               User changes form he wants to edit                |
| 5              |                       User clicks on done                       |

### Use case 18, UC18 - Sort Transactions

| Actors Involved  |                   User                   |
| ---------------- | :--------------------------------------: |
| Precondition     |              User is logged              |
| Post condition   | User has the list of transactions sorted |
| Nominal Scenario |            Sort transactions             |
| Variants         |                                          |
| Exceptions       |                                          |

##### Scenario 18.1

| Scenario 18.1  |                     Sort transactions                      |
| -------------- | :--------------------------------------------------------: |
| Precondition   |                       User is logged                       |
| Post condition |          User has the list of transactions sorted          |
| Step#          |                        Description                         |
| 1              |                 User is in first dashboard                 |
| 2              |              User clicks on combobox sort by               |
| 3              |               User selects a sorting option                |
| 4              | System shows the list of transactions in the screen sorted |
| 5              |          User scrolls to see all the transactions          |

### Use case 19, UC19 - List Personal Transactions

| Actors Involved  |               User                |
| ---------------- | :-------------------------------: |
| Precondition     |          User is logged           |
| Post condition   | User has the list of transactions |
| Nominal Scenario |       List all transactions       |
| Variants         |                                   |
| Exceptions       |                                   |

##### Scenario 19.1

| Scenario 19.1  |                List all transactions                |
| -------------- | :-------------------------------------------------: |
| Precondition   |                   User is logged                    |
| Post condition |          User has the list of transactions          |
| Step#          |                     Description                     |
| 1              |             User is in first dashboard              |
| 2              | System shows the list of transactions in the screen |
| 3              |      User scrolls to see all the transactions       |

### Use case 20, UC20 - List Transaction with Category Label

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     |         User added transaction          |
| Post condition   | System shows transaction with his label |
| Nominal Scenario |       List transaction with label       |
| Variants         |                                         |
| Exceptions       |                                         |

##### Scenario 20.1

| Scenario 20.1  |              List transaction with label              |
| -------------- | :---------------------------------------------------: |
| Precondition   |                User added transaction                 |
| Post condition |        System shows transaction with his label        |
| Step#          |                      Description                      |
| 1              | System returns transactions with their category label |

### Use case 21, UC21 - List Group Transactions

| Actors Involved  |                        Group Administrator                         |
| ---------------- | :----------------------------------------------------------------: |
| Precondition     | Group Administrator is logged and in Group Administrator dashboard |
| Post condition   |  Group Administrator has the list of transactions of every users   |
| Nominal Scenario |                List all transactions of every users                |
| Variants         |                                                                    |
| Exceptions       |                                                                    |

##### Scenario 21.1

| Scenario 21.1  |                      List Group Transactions                       |
| -------------- | :----------------------------------------------------------------: |
| Precondition   | Group Administrator is logged and in Group Administrator dashboard |
| Post condition |  Group Administrator has the list of transactions of every users   |
| Step#          |                            Description                             |
| 1              |         Group Administrator clicks on get all transactions         |
| 2              | System shows the list of transactions of every users in the screen |

### Use case 22, UC22 - Create Report

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |    User has a report of his expenses    |
| Nominal Scenario |          User creates a report          |
| Variants         |                                         |
| Exceptions       |                                         |

##### Scenario 22.1

| Scenario 22.1  |           User creates a report            |
| -------------- | :----------------------------------------: |
| Precondition   |  User is logged and in profile dashboard   |
| Post condition |     User has a report of his expenses      |
| Step#          |                Description                 |
| 1              |    User clicks on create report button     |
| 2              |            User fills the form             |
| 3              |           User clicks on create            |
| 4              | System retrieves report for chosen options |

### Use case 23, UC23 - Export Report

| Actors Involved  |          User           |
| ---------------- | :---------------------: |
| Precondition     |    User has a report    |
| Post condition   | User exports the report |
| Nominal Scenario |  User exports a report  |
| Variants         |                         |
| Exceptions       |                         |

##### Scenario 23.1

| Scenario 23.1  |        User exports a report        |
| -------------- | :---------------------------------: |
| Precondition   |      User is report dashboard       |
| Post condition |     User has a report exported      |
| Step#          |             Description             |
| 1              | User clicks on create report button |
| 2              |      User clicks on export pdf      |
| 3              |    User choose download or print    |

### Use case 24, UC24 - Create Group Report

| Actors Involved  |                        Group Administrator                         |
| ---------------- | :----------------------------------------------------------------: |
| Precondition     | Group Administrator is logged and in Group Administrator dashboard |
| Post condition   |          Group Administrator has a report of all expenses          |
| Nominal Scenario |     Group Administrator creates a report on every transactions     |
| Variants         |                                                                    |
| Exceptions       |                                                                    |

##### Scenario 24.1

| Scenario 24.1  |                Group Administrator creates a Group Report                |
| -------------- | :----------------------------------------------------------------------: |
| Precondition   |    Group Administrator is logged and in Group Administrator dashboard    |
| Post condition |             Group Administrator has a report of all expenses             |
| Step#          |                               Description                                |
| 1              | Group Administrator clicks on create report of every transactions button |
| 2              |                    Group Administrator fills the form                    |
| 3              |                   Group Administrator clicks on create                   |
| 4              |                System retrieves report for chosen options                |

### Use case 25, UC25 - Create Threshold

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |          User sets a threshold          |
| Nominal Scenario |          User sets a threshold          |
| Variants         |                                         |
| Exceptions       |                                         |

##### Scenario 25.1

| Scenario 25.1  |          User sets a threshold          |
| -------------- | :-------------------------------------: |
| Precondition   | User is logged and in profile dashboard |
| Post condition |          User sets a threshold          |
| Step#          |               Description               |
| 1              |   User clicks on set threshold button   |
| 2              |           User fills the form           |
| 3              |          User clicks on create          |
| 4              |    System retrieves a success alert     |

### Use case 26, UC26 - Receive Threshold Alert

| Actors Involved  |                         User                         |
| ---------------- | :--------------------------------------------------: |
| Precondition     | User set a thresold and is near overcoming 90% of it |
| Post condition   |               User receives a warning                |
| Nominal Scenario |                User receives an alert                |
| Variants         |                                                      |
| Exceptions       |                                                      |

##### Scenario 26.1

| Scenario 26.1  |                 User receives alert                  |
| -------------- | :--------------------------------------------------: |
| Precondition   | User set a thresold and is near overcoming 90% of it |
| Post condition |               User receives a warning                |
| Step#          |                     Description                      |
| 1              |             System shows the alert popup             |
| 2              |                  User clicks on ok                   |

### Use case 27, UC27 - Set Threshold for User in the Group

| Actors Involved  |                        Group Administrator                         |
| ---------------- | :----------------------------------------------------------------: |
| Precondition     | Group Administrator is logged and in Group Administrator dashboard |
| Post condition   |           Group Administrator sets a threshold on a user           |
| Nominal Scenario |           Group Administrator sets a threshold on a user           |
| Variants         |                                                                    |
| Exceptions       |                                                                    |

##### Scenario 27.1

| Scenario 27.1  |      Group Administrator sets Threshold for User in the Group      |
| -------------- | :----------------------------------------------------------------: |
| Precondition   | Group Administrator is logged and in Group Administrator dashboard |
| Post condition |           Group Administrator sets a threshold on a user           |
| Step#          |                            Description                             |
| 1              |   Group Administrator clicks on set threshold for a user button    |
| 2              |                 Group Administrator fills the form                 |
| 3              |                Group Administrator clicks on create                |
| 4              |                  System retrieves a success alert                  |

### Use case 28, UC28 - Show Ads

| Actors Involved  |      Ads service       |
| ---------------- | :--------------------: |
| Precondition     | Ads setupped correctly |
| Post condition   |    System shows ads    |
| Nominal Scenario |    System shows ads    |
| Variants         |                        |
| Exceptions       |                        |

##### Scenario 28.1

| Scenario 28.1  |                    System shows ads                     |
| -------------- | :-----------------------------------------------------: |
| Precondition   |                 Ads setupped correctly                  |
| Post condition |                    System shows ads                     |
| Step#          |                       Description                       |
| 1              | System send query to ads service to check available ads |
| 2              |                  System downloads ads                   |

# Glossary

The glossary is described using a class diagram.

```plantuml
top to bottom direction

class Account {
  ID
  username
  email
  password
}

class User {

}

class "Group Administrator" {

}

class Group {
  ID
}

class Transaction {
  ID
  name
  amount
  date
}

class Category {
  ID
  type
  color
}

class Threshold {
  period
}

class Report {
  period
}

"Group Administrator" -|> User : "         "
"Group Administrator" "1" -- "1" Group : "Manage"
Group "0..1" - "1..*" Account : "                 "
Account -- "*" Transaction : "Store"
Transaction "0..*" - "1" Category : "       "
User -- "1..*" Account : "Create"
Account -- Threshold : "Set"
Account -- Report : "Generate"
Threshold -- "0..*" Category : "Based on"
Report -- "0..*" Category : "Based on"
Account -- "1..*" Category : "Create"

note "User account stored on the server" as n1
note "A cash movement made by the User\nand manually added and stored in the application. \nGrouped in Categories" as n2
note "A type of transaction" as n3
note "User must create an account to interact with the app" as n4
note "A threshold can be setted on one or more Categories \nbased on a period of time" as n5
note "A report can be created on one or more Categories \nbased on a period of time" as n6
note "A group of Users managed by\na single Group Administrator" as n7

n7 . Group
Account . n1
Transaction .. n2
Category .. n3
User . n4
Threshold .. n5
Report .... n6
```

# System Design

```plantuml
class "iOS App" as c1
class "Android App" as c2
class "Browser" as c3
class "EZWallet Server" as c6
class "EZWallet Client" as c7
class "EZWallet System" as c8

c1 --|> c7
c2 --|> c7
c3 --|> c7
c6 --o c8
c7 --o c8
```

# Deployment Diagram

Client-Server application model.

```plantuml
artifact "iOS App" as a1
artifact "Android App" as a2
artifact "Browser" as a3
artifact "EZWallet Server" as a4
artifact "Database Service" as a6
artifact "Ads Service" as a7
database "Database Server\n" as db
node "EZWallet Server Machine" as s
node "iOS Device" as n1
node "Android Device" as n2
node "Desktop Computer" as n3
node "Ads Server" as n4

db -- s : "Internal"
a6 -- db : "Deploy"
s -- n1 : "Internet"
s -- n2 : "Internet"
s -- n3 : "Internet"
s -- a4 : "Deploy"
s -- n4 : "Internet"
n4 -- a7 : "Deploy"

n1 -- a1 : "Deploy"
n2 -- a2 : "Deploy"
n3 -- a3 : "Deploy"
```
