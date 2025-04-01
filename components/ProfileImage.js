const ProfileImage = ({ name, imageUrl }) => {
    // Generate initials from name
    const getInitials = (name) => {
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
          getInitials(name)
        )}
      </div>
    );
  };
  
  export default ProfileImage;
  