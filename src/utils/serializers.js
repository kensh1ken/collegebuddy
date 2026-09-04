function publicUser(user) {
  if (!user) return null;
  const source = typeof user.toObject === "function" ? user.toObject() : user;
  return {
    id: String(source._id || source.id),
    _id: source._id || source.id,
    name: source.name,
    role: source.role,
    course: source.course,
    branch: source.branch,
    currentSem: source.currentSem,
    profileCompleted: source.profileCompleted,
  };
}

function privateUser(user) {
  if (!user) return null;
  const source = typeof user.toObject === "function" ? user.toObject() : user;
  return {
    ...publicUser(source),
    email: source.email,
    rollNumber: source.rollNumber,
    isBlocked: source.isBlocked,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

module.exports = { publicUser, privateUser };
