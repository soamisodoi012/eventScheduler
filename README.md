# it is containerized public repository that work on docker and ngix configuration
# make shure you have already install gitbash and docker desktopp
# open command prompt
mkdir yourdir
cd yourdir
# clone the repository using 
   git clone --branch eventSchedulerContainerizeSecond https://github.com/soamisodoi012/eventScheduler.git
# navigate to eventScheduler
   run your docker desktop (open your docker desktop)
# build
   docker-compose build (docker-compose build frontend or docker-compose build backend)
# run
   docker-compose up -d
# to show django administration site create superuser
   docker-compose exec backend python manage.py createsuperuser
# enter the promppt credintial
username,email,password
open browser 
http://localhost/admin
# enduser
http://localhost/
# show log
   docker-compose logs -f backend
   docker-compose logs -f frontend
   
