const { ObjectID } = require('mongodb')

const repository = (db) => {
  const ProjectsDb = db.collection('projects')

  return {
    findAll: () => ProjectsDb.find().toArray(),

    findById: (_id) => ProjectsDb.findOne({ _id }),

    createProject: (project) => ProjectsDb.insertOne(project),

    deleteProject: (id) => ProjectsDb.deleteOne({ _id: ObjectID(id) }),

    updateProject: (id, project) => ProjectsDb.findOneAndUpdate(
      { _id: ObjectID(id) },
      { $set: project },
      { returnOriginal: false })
  }
}

module.exports = repository
