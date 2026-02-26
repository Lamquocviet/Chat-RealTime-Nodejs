export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const {username} = req.query;

    if(!username || username.trim() === "") {
      return res.status(400).json({message: "Phải cung cấp username để tìm kiếm"});
    }

    const user = await User.findOne({username}).select("_id username avatarUrl displayName");

    return res.status(200).json({user});

  } catch (error) {
    console.error("Lỗi khi searchUserByUsername", error);
    return res.status(500).json({message: "Lỗi hệ thống"});
  }
}
