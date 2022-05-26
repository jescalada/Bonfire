## 2800-202210-DTC17
Bonfire is an app for civil discussion of various topics.

## Bonfire

* [General info](#general-info)
* [Website](#website)
* [Technologies](#technologies)
* [Contents](#content)
* [Build requirements](#build-requirements)
* [Build](#build)
* [Features](#features)
* [Resources](#resources)
* [Acknowledgements](#acknowledgements)
* [Contact](#contact)

## General Info
Bonfire is an app for civil discussion of various topics.

Minimum character limits and maximum Likes and Comments per day were implemented to improve quality of discussion. 

## Website
[Bonfire](https://thebonfireapp.herokuapp.com/)
	
## Technologies
Technologies used for this project:
* Node.js
* Express.js
* MySQL
* AWS Redis (MySQL cloud solution)
* Heroku
* Embedded Javascript (EJS)
* Bootstrap

## Content
Content of the project folder:

```
 Top level of project folder: 
├── .gitignore               # Git ignore file
├── app.js                   # Starts the express app, automatically run by Heroku upon deployment
├── package.json             # Contains dependencies for node package installation
└── README.md                # woah, you're reading this now!

It has the following subfolders and files:
├── .git                     # Folder for git repo

├── public                   # Folder for front-end files
        /images              # Folder for public images
        /styles              # Folder for global stylesheets
                /style.css   # Contains global CSS rules

├── scripts                  # Folder for scripts
        /data-manager.js     # Provides functions for querying the database
        /database.js         # Provides functions for manipulating database tables and obtaining a connection pool
        /passport-config.js  # Contains the configuration for passport.js (Authentication middleware)
        /router.js           # Contains all the routes (endpoints) for the backend
        
├── views                           # Folder for views (rendered with EJS)
        /pages                      # Folder for complete pages to render
                /admin.ejs          # Template for Admin dashboard
                /contact.ejs        # Template for Contact Us page
                /contact2.ejs       # Template for post-contact form
                /index.ejs          # Template for landing page
                /login.ejs          # Template for Login page
                /mission.ejs        # Template for Mission page
                /post.ejs           # Template for post info page
                /profile.ejs        # Template for Profile page
                /register.ejs       # Template for Register page
                /siterules.ejs      # Template for Site Rules page
                /team.ejs           # Template for Team page
        /partials                   # Folder for partial EJS templates
                /footer.ejs         # Footer component template
                /head.ejs           # Head component template
                /header.ejs         # Header component template
                /post_modal.ejs     # Post Modal component template
        
```

## Build requirements
1. Install Node v16.15
2. Install npm v8.10

## Build
1. Add a .env file with the variable SESSION_SECRET
2. Execute the following commands in the directory where you want to build the project
```
npm install
npm run devStart
```
3. Access the local build at localhost:3000

## Features
1. Registering user accounts
2. Registering admin account (include admin after the @ during account creation, Ex: juan@admin.com)
3. Logging into an account
4. Viewing all posts
5. Viewing post details
6. Making posts
7. Commenting on posts
8. Liking posts and comments
9. Viewing profiles
10. Admin Functionalities: Dashboard, Post and User Moderation

## Resources 
- Logo made by Juan 
- Login image from [unsplash](https://unsplash.com/) (Free to use) 
- Site rules adapted from reddit.com 

## Acknowledgements 
* <a href="https://ejs.co/">EJS</a>
* <a href="https://www.npmjs.com/package/bcrypt">bcrypt</a>
* <a href="https://getbootstrap.com/">Bootstrap</a>
* <a href="https://www.passportjs.org/">Passport.js</a>

## Contact 
* [Andrew Anca - aanca@my.bcit.ca](mailto:aanca@my.bcit.ca)
* [Juan Escalada - jescalada@my.bcit.ca](mailto:jescalada@my.bcit.ca)
* [Stefan Chen - zchen158@my.bcit.ca](mailto:zchen158@my.bcit.ca)
* [Jacky Yau - wyau5@my.bcit.ca](mailto:wyau5@my.bcit.ca)
