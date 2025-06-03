# it is containerized public repository that work on docker and ngix configuration
# make shure you have already install gitbash and docker desktopp
# open gitbash
mkdir event
cd event
# clone the repository using 
   git clone --branch eventSchedulerFinal https://github.com/soamisodoi012/eventScheduler.git
# navigate to eventScheduler
   cd eventScheduler
 # convert Windows-style line endings (CRLF) to Unix-style line endings (LF) in a file.
      dos2unix ./backend/entrypoint.sh
   run your docker desktop (open your docker desktop)
# build
   docker-compose build (docker-compose build frontend or docker-compose build backend)
# run
   docker-compose up -d
# to show django administration site create superuser
   docker-compose exec backend python manage.py createsuperuser
# enter the prompt credintial
username,email,password
# open browser for admin 
http://localhost/admin
# enduser event Scheduler url
http://localhost/
# show log
   docker-compose logs -f backend
   docker-compose logs -f frontend
   
