pipeline {
  agent any
  
  tools { nodejs "node"}
  stages{
    stage('build'){
      steps{
          sh "npm run build"
      }
    }
    stage('start'){
      steps{
        sh "npm start"
      }
    }
  }
}
