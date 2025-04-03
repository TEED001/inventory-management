const ProfileImage = ({ name = "User Name", imageUrl }) => {
  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return ""; // Fallback for undefined or empty name
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 text-white font-bold">
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span> // Display initials if no image
      )}
    </div>
  );
};

export default ProfileImage;
