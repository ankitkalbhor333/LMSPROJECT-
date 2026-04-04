const MONGODB_OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const isObjectIdLike = (value) => MONGODB_OBJECT_ID_REGEX.test(String(value || "").trim());

const INVALID_DISPLAY_VALUES = new Set(["undefined", "null", "nan", "[object object]"]);

const isDisplayableName = (value) => {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return false;
  }

  if (isObjectIdLike(normalized)) {
    return false;
  }

  return !INVALID_DISPLAY_VALUES.has(normalized.toLowerCase());
};

export const resolveInstructorName = (courseLike, fallback = "Expert Faculty") => {
  if (!courseLike) {
    return fallback;
  }

  if (typeof courseLike === "string") {
    const normalized = courseLike.trim();
    if (isDisplayableName(normalized)) {
      return normalized;
    }
    return fallback;
  }

  if (typeof courseLike !== "object") {
    return fallback;
  }

  const directInstructor = courseLike.instructor;

  if (typeof directInstructor === "string") {
    const normalized = directInstructor.trim();
    if (isDisplayableName(normalized)) {
      return normalized;
    }
  }

  if (directInstructor && typeof directInstructor === "object") {
    const nestedName = String(directInstructor.name || "").trim();
    if (isDisplayableName(nestedName)) {
      return nestedName;
    }
  }

  const fallbackName = String(
    courseLike.instructorName ||
      courseLike.teacherName ||
      courseLike.teacher?.name ||
      courseLike.user?.name ||
      ""
  ).trim();

  if (isDisplayableName(fallbackName)) {
    return fallbackName;
  }

  return fallback;
};
