# Requirements Document - current EZWallet

Date: 25/04/2023

Version: V1 - description of EZWallet in CURRENT form (as received by teachers)

| Version number | Change                          |
| -------------- | :------------------------------ |
| 0.1            | Initial code inspection         |
| 0.2            | Clean-up                        |
| 0.3            | Added Diagrams                  |
| 0.4            | Fixed Diagrams                  |
| 0.5            | Added Glossary, Admin changes   |
| 0.6            | Added Personas and Stories      |
| 0.7            | Fixed stakeholders and diagrams |
| 0.8            | Added Use Cases                 |
| 0.9            | Fixed Use Cases                 |
| 0.10           | Updated and Fixed Diagrams      |
| 0.11           | Fixed Use cases                 |
| 1              | Final Review                    |

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

# Stakeholders

| Stakeholder name |                                  Description                                  |
| ---------------- | :---------------------------------------------------------------------------: |
| User             |                       Standard user of the application                        |
| DB Administrator |                      Database manager of the application                      |
| COO              | The chief operating officer who manages operational functions of the business |

# Context Diagram and interfaces

## Context Diagram

```plantuml
actor "User" as a1
actor "DB Administrator" as a2
actor "COO" as a3

(EZWallet) -- a1
(EZWallet) -- a2
(EZWallet) -- a3
```

## Interfaces

| Actor            | Logical Interface |                       Physical Interface |
| ---------------- | :---------------: | ---------------------------------------: |
| User             | Web & Mobile GUI  | Screen, Mouse and Keyboard / Touchscreen |
| DB Administrator |     DBMS GUI      |               Screen, Mouse and Keyboard |
| COO              | Web & Mobile GUI  | Screen, Mouse and Keyboard / Touchscreen |

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
**Story**: he is a university student who wants to handle his budget; he needs to organize his expenses not only for universitary matters, food, rent/bills but also for personal interests like going out with his friends. In this way he can trace his transactions and find different ways to cut off useless expenses in order to save some money.

# Functional and non functional requirements

## Functional Requirements

| ID      |                        Description                        |
| ------- | :-------------------------------------------------------: |
| **FR1** |              **Authorize and Authenticate**               |
| FR1.1   |                    Register an account                    |
| FR1.2   |                  Log in into an account                   |
| FR1.3   |                  Log out of the account                   |
| **FR2** |                     **Manage Users**                      |
| FR2.1   |  List all users credentials (Username, Email, Password)   |
| FR2.2   | Retreive personal credentials (Username, Email, Password) |
| **FR3** |                   **Manage Categories**                   |
| FR3.1   |                      Add a category                       |
| FR3.2   |                    List all categories                    |
| **FR4** |                  **Manage Transactions**                  |
| FR4.1   |                     Add a transaction                     |
| FR4.2   |                   Delete a transaction                    |
| FR4.3   |                   List all transactions                   |
| FR4.4   |        List all transactions with category labels         |

## Non Functional Requirements

| ID   |      Type       |                                                 Description                                                 | Refers to |
| ---- | :-------------: | :---------------------------------------------------------------------------------------------------------: | --------: |
| NFR1 |   Portability   |               The application should be developed and deployed for iOS, Android and Web usage               |   All FRs |
| NFR2 |   Efficiency    |                               All functions should complete in under 1 second                               |   All FRs |
| NFR3 |    Usability    |                       Users should not need specific training to use the application                        |   All FRs |
| NFR4 |    Security     |                                   The application should comply with GDPR                                   |   All FRs |
| NFR5 |    Security     | All information about the users and their inserted data should not become public outside of the application |   All FRs |
| NFR6 | Maintainability |                The needed time to fix/add/remove a function should be under 20 person-hours                 |   All FRs |

# Use case diagram and use cases

## Use case diagram

```plantuml
left to right direction
actor "User" as a1

rectangle EZWallet {
  usecase "Authorize and Authenticate" as UC1
    usecase "User Registration" as UC1_1
    usecase "User Login" as UC1_2
    usecase "User Logout" as UC1_3
  usecase "Manage Users" as UC2
    usecase "Get All Users Credentials" as UC2_1
    usecase "Get Personal User Credentials" as UC2_2
  usecase "Manage Categories" as UC3
    usecase "Create Category" as UC3_1
    usecase "List Categories" as UC3_2
  usecase "Manage Transactions" as UC4
    usecase "Create Transaction" as UC4_1
    usecase "List Transactions" as UC4_2
    usecase "Delete Transaction" as UC4_3
    usecase "List Transaction with Category Label" as UC4_4
}

a1 -- UC1
a1 -- UC2
a1 -- UC3
a1 -- UC4

UC1 ..> UC1_1 : "Include"
UC1 ..> UC1_3 : "Include"
UC1 ..> UC1_2 : "Include"

UC2 ..> UC2_1 : "Include"
UC2 ..> UC2_2 : "Include"

UC3 ..> UC3_1 : "Include"
UC3 ..> UC3_2 : "Include"

UC4 ..> UC4_1 : "Include"
UC4 ..> UC4_2 : "Include"
UC4 ..> UC4_3 : "Include"
UC4_2 <|-- UC4_4

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

| Actors Involved  |             User              |
| ---------------- | :---------------------------: |
| Precondition     |  User is in profile section   |
| Post condition   |  User obtains list of users   |
| Nominal Scenario | Get list of users credentials |
| Variants         |                               |
| Exceptions       |                               |

##### Scenario 4.1

| Scenario 4.1   |        Get list of users credentials        |
| -------------- | :-----------------------------------------: |
| Precondition   |   User is logged and in profile dashboard   |
| Post condition |       User has got list of all users        |
| Step#          |                 Description                 |
| 1              | User clicks on get users in database button |
| 2              |            DB returns the result            |

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

### Use case 6, UC6 - Create Category

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |          User added a category          |
| Nominal Scenario |           User adds category            |
| Variants         |                                         |
| Exceptions       |                                         |

##### Scenario 6.1

| Scenario 6.1   |                  User adds category                  |
| -------------- | :--------------------------------------------------: |
| Precondition   |                    User is logged                    |
| Post condition |                User added a category                 |
| Step#          |                     Description                      |
| 1              |             User clicks on edit category             |
| 2              |           User clicks on add new category            |
| 3              |                   User fills form                    |
| 4              |           System stores on DB the category           |
| 5              | App gives alert about transaction added successfully |

### Use case 7, UC7 - List Categories

| Actors Involved  |              User               |
| ---------------- | :-----------------------------: |
| Precondition     |         User is logged          |
| Post condition   | User has the list of categories |
| Nominal Scenario |       List all categories       |
| Variants         |                                 |
| Exceptions       |                                 |

##### Scenario 7.1

| Scenario 7.1   |                List all categories                |
| -------------- | :-----------------------------------------------: |
| Precondition   |                  User is logged                   |
| Post condition |          User has the list of categories          |
| Step#          |                    Description                    |
| 1              |            User is in first dashboard             |
| 2              | System shows the list of categories in the screen |

### Use case 8, UC8 - Create Transaction

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |        User added a transaction         |
| Nominal Scenario |     User adds a transaction via web     |
| Variants         |   User adds a transaction via mobile    |
| Exceptions       |                                         |

##### Scenario 8.1

| Scenario 8.1   |             User adds a transaction via web             |
| -------------- | :-----------------------------------------------------: |
| Precondition   |         User is logged and in profile dashboard         |
| Post condition |                User added a transaction                 |
| Step#          |                       Description                       |
| 1              |             User clicks on edit transaction             |
| 2              |           User clicks on add new transaction            |
| 3              |                     User fills form                     |
| 4              |           System stores on DB the transaction           |
| 5              | System gives alert about transaction added successfully |

##### Scenario 8.2

| Scenario 8.2   |           User adds a transaction via mobile            |
| -------------- | :-----------------------------------------------------: |
| Precondition   |         User is logged and in profile dashboard         |
| Post condition |                User added a transaction                 |
| Step#          |                       Description                       |
| 1              |             User clicks on the plus button              |
| 2              |                     User fills form                     |
| 3              |           System stores on DB the transaction           |
| 4              | System gives alert about transaction added successfully |

### Use case 9, UC9 - Delete Transaction

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     | User is logged and in profile dashboard |
| Post condition   |       User deleted a transaction        |
| Nominal Scenario |   User deletes a transaction via web    |
| Variants         |  User deletes a transaction via mobile  |
| Exceptions       |                                         |

##### Scenario 9.1

| Scenario 9.1   |               User deletes a transaction via web                |
| -------------- | :-------------------------------------------------------------: |
| Precondition   |             User is logged and in profile dashboard             |
| Post condition |                     User deleted an expense                     |
| Step#          |                           Description                           |
| 1              |                 User clicks on edit transaction                 |
| 2              | User clicks on trash icon of the transaction he wants to delete |
| 3              |      System gives alert if user is sure he wants to delete      |
| 4              |        If no user returns to edit transaction dashboard         |
| 5              |             If yes selected transaction is deleted              |

##### Scenario 9.2

| Scenario 9.2   |              User deletes a transaction via mobile              |
| -------------- | :-------------------------------------------------------------: |
| Precondition   |             User is logged and in profile dashboard             |
| Post condition |                     User deleted an expense                     |
| Step#          |                           Description                           |
| 1              |        User clicks on the transaction he wants to delete        |
| 2              | User clicks on trash icon of the transaction he wants to delete |
| 3              |      System gives alert if user is sure he wants to delete      |
| 4              |        If no user returns to edit transaction dashboard         |
| 5              |             If yes selected transaction is deleted              |

### Use case 10, UC10 - List Transactions

| Actors Involved  |               User                |
| ---------------- | :-------------------------------: |
| Precondition     |          User is logged           |
| Post condition   | User has the list of transactions |
| Nominal Scenario |       List all transactions       |
| Variants         |                                   |
| Exceptions       |                                   |

##### Scenario 10.1

| Scenario 10.1  |                List all transactions                |
| -------------- | :-------------------------------------------------: |
| Precondition   |                   User is logged                    |
| Post condition |          User has the list of transactions          |
| Step#          |                     Description                     |
| 1              |             User is in first dashboard              |
| 2              | System shows the list of transactions in the screen |
| 3              |      User scrolls to see all the transactions       |

### Use case 11, UC11 - List Transaction with Category Label

| Actors Involved  |                  User                   |
| ---------------- | :-------------------------------------: |
| Precondition     |         User added transaction          |
| Post condition   | System shows transaction with his label |
| Nominal Scenario |       List transaction with label       |
| Variants         |                                         |
| Exceptions       |                                         |

##### Scenario 11.1

| Scenario 11.1  |              List transaction with label              |
| -------------- | :---------------------------------------------------: |
| Precondition   |                User added transaction                 |
| Post condition |        System shows transaction with his label        |
| Step#          |                      Description                      |
| 1              | System returns transactions with their category label |

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

Account -- "*" Transaction : "Store"
Transaction "0..*" - "1" Category : "       "
User --"1..*" Account : "Create"
Account -- "1..*" Category : "Create"

note "User account stored on the server" as n1
note "A cash movement made by the User and manually added and stored in the application. \nGrouped in Categories" as n2
note "A type of transaction" as n3
note "User musts create an account to interact with the app" as n4

Account . n1
Transaction .. n2
Category . n3
User . n4
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
database "Database Server\n" as db
node "EZWallet Server Machine" as s
node "iOS Device" as n1
node "Android Device" as n2
node "Desktop Computer" as n3

db -- s : "Internal"
a6 -- db : "Deploy"
s -- n1 : "Internet"
s -- n2 : "Internet"
s -- n3 : "Internet"
s -- a4 : "Deploy"

n1 -- a1 : "Deploy"
n2 -- a2 : "Deploy"
n3 -- a3 : "Deploy"
```

# Notes - Defects

This initial version of the application's code shows several flaws. Some of them are listed here:

- Even if the method **getUsers** inside _users.js_ assumes the presence of an Admin, there currently is no way to distinguish one from a normal User. So for the original deployment every user can obtain the information about every users in the database.
- The method **get_label** should return color as a parameter but this is not the case.
