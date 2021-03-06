const ProjectEntity = require('../../domain/Project')
const AboutEntity = require('../../domain/About')
const fs = require('fs')
const path = require('path')
const Datauri = require('datauri/parser')

const dUri = new Datauri()

module.exports = ({
  // usersRepo,
  projectRepo,
  imageRepo,
  uploadConfig,
  cloud,
  // drive,
  encrypt,
  jwt,
  log
}) => {
  const getProjects = async (id) => {
    const projects = await projectRepo.findAll()

    if (!id) {
      return projects
    }

    const project = projects
      .find((project) => project._id.toString() === id)

    return {
      project,
      projects: projects.filter((project) => !project.isAbout)
    }
  }

  const createProject = async (projectData) => {
    const project = ProjectEntity(projectData)

    const createdProject = await projectRepo.createProject(project)

    if (!createdProject.result.ok) {
      throw new Error('Project couldn\'t have been created')
    }

    return {
      _id: createdProject.insertedId,
      ...project
    }
  }

  const updateProject = async (projectData) => {
    const project = ProjectEntity(projectData)

    const updatedProject = await projectRepo.updateProject(projectData._id, project)

    if (updatedProject.ok && updatedProject.value) {
      return updatedProject.value
    }

    throw new Error('Error when updating project in database.')
  }

  const deleteProject = async (projectId) => {
    const deletedProject = await projectRepo.deleteProject(projectId)

    if (deletedProject.result.ok) {
      return {
        success: true,
        projectId
      }
    }

    return {
      success: false,
      errors: ['Project didn\'t have been deleted']
    }
  }

  const getImages = async () => {
    const images = await imageRepo.findAll()

    return images
  }

  const createImage = async (fileName) => {
    const image = {
      name: fileName
    }

    const { insertedCount, insertedId } = await imageRepo.createOne(image)

    if (insertedCount === 1) {
      return {
        _id: insertedId,
        name: fileName
      }
    }

    throw new Error('Error when inserting image in database.')
  }

  const createAndUploadImage = async (file) => {
    const fileName = encrypt.encryptFileName(file.originalname)
    file.name = fileName
    const fileData = await (dUri.format(path.extname(file.originalname).toString(), file.buffer)).content

    const { public_id, url } = await cloud.uploader.upload(fileData)

    const image = {
      name: public_id,
      url
    }

    const { insertedCount, insertedId } = await imageRepo.createOne(image)

    if (insertedCount === 1) {
      return {
        _id: insertedId,
        ...image
      }
    }

    throw new Error('Error when inserting image in database.')
  }

  const unlinkImg = (pathToFile, name) => {
    return new Promise((resolve, reject) => {
      fs.unlink(path.join(pathToFile, name), (err) => {
        if (err) {
          log.info('This img doesn\'t exist as a file')
          resolve()
        }
        resolve()
      })
    })
  }

  const deleteImage = async (id, name) => {
    const { result } = await cloud.uploader.destroy(name)

    if (result !== 'ok') {
      throw new Error('Error when deleting image in cloudinary')
    }

    const { deletedCount } = await imageRepo.deleteOne(id)

    if (deletedCount !== 1) {
      log.info(`This img doesn't exists in DB ${name}`)
    }
  }

  const getAboutProject = () => {
    return projectRepo.getAboutProject()
  }

  const updateOrCreateAbout = async (aboutData) => {
    const about = AboutEntity(aboutData)

    // Getting an _id from the front means the about project already exist
    if (aboutData._id) {
      const updatedProject = await projectRepo.updateProject(aboutData._id, about)

      return updatedProject.value
    } else {
      const { insertedId } = await projectRepo.createProject(about)

      return {
        _id: insertedId,
        ...about
      }
    }
  }

  return {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getImages,
    createImage,
    createAndUploadImage,
    deleteImage,
    getAboutProject,
    updateOrCreateAbout
  }
}
