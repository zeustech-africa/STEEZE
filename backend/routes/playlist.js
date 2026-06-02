import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// PLAYLIST ENDPOINTS
// ============================================

// Get all playlists for current user
router.get("/playlists", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        songs: {
          include: {
            post: {
              include: {
                creator: {
                  select: {
                    id: true,
                    fullName: true,
                    artistName: true,
                    profilePicUrl: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, playlists });
  } catch (error) {
    console.error("Get playlists error:", error);
    res.status(500).json({ error: "Failed to get playlists" });
  }
});

// Get single playlist by ID
router.get("/playlists/:playlistId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { playlistId } = req.params;

    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
      include: {
        songs: {
          include: {
            post: {
              include: {
                creator: {
                  select: {
                    id: true,
                    fullName: true,
                    artistName: true,
                    profilePicUrl: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    res.json({ success: true, playlist });
  } catch (error) {
    console.error("Get playlist error:", error);
    res.status(500).json({ error: "Failed to get playlist" });
  }
});

// Create new playlist
router.post("/playlists", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, coverImage } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Playlist name is required" });
    }

    const playlist = await prisma.playlist.create({
      data: {
        userId,
        name: name.trim(),
        description: description || null,
        coverImage: coverImage || null
      }
    });

    res.json({ success: true, playlist });
  } catch (error) {
    console.error("Create playlist error:", error);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

// Update playlist (rename, change description, cover image)
router.put("/playlists/:playlistId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { playlistId } = req.params;
    const { name, description, coverImage } = req.body;

    const existingPlaylist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId }
    });

    if (!existingPlaylist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const updatedPlaylist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description : undefined,
        coverImage: coverImage !== undefined ? coverImage : undefined
      }
    });

    res.json({ success: true, playlist: updatedPlaylist });
  } catch (error) {
    console.error("Update playlist error:", error);
    res.status(500).json({ error: "Failed to update playlist" });
  }
});

// Delete playlist
router.delete("/playlists/:playlistId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { playlistId } = req.params;

    const existingPlaylist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId }
    });

    if (!existingPlaylist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    await prisma.playlist.delete({
      where: { id: playlistId }
    });

    res.json({ success: true, message: "Playlist deleted" });
  } catch (error) {
    console.error("Delete playlist error:", error);
    res.status(500).json({ error: "Failed to delete playlist" });
  }
});

// Add song to playlist
router.post("/playlists/:playlistId/songs", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { playlistId } = req.params;
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    // Verify playlist belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId }
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if song already in playlist
    const existingSong = await prisma.playlistSong.findFirst({
      where: { playlistId, postId }
    });

    if (existingSong) {
      return res.status(400).json({ error: "Song already in playlist" });
    }

    // Get current max order
    const maxOrder = await prisma.playlistSong.aggregate({
      where: { playlistId },
      _max: { order: true }
    });

    const playlistSong = await prisma.playlistSong.create({
      data: {
        playlistId,
        postId,
        order: (maxOrder._max.order || 0) + 1
      },
      include: {
        post: {
          include: {
            creator: {
              select: {
                id: true,
                fullName: true,
                artistName: true
              }
            }
          }
        }
      }
    });

    res.json({ success: true, song: playlistSong });
  } catch (error) {
    console.error("Add song to playlist error:", error);
    res.status(500).json({ error: "Failed to add song to playlist" });
  }
});

// Remove song from playlist
router.delete("/playlists/:playlistId/songs/:postId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { playlistId, postId } = req.params;

    // Verify playlist belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId }
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    await prisma.playlistSong.deleteMany({
      where: { playlistId, postId }
    });

    res.json({ success: true, message: "Song removed from playlist" });
  } catch (error) {
    console.error("Remove song from playlist error:", error);
    res.status(500).json({ error: "Failed to remove song from playlist" });
  }
});

// Reorder songs in playlist
router.put("/playlists/:playlistId/reorder", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { playlistId } = req.params;
    const { songOrders } = req.body; // Array of { postId, order }

    // Verify playlist belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId }
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Update each song's order
    await Promise.all(
      songOrders.map(({ postId, order }) =>
        prisma.playlistSong.updateMany({
          where: { playlistId, postId },
          data: { order }
        })
      )
    );

    res.json({ success: true, message: "Playlist reordered" });
  } catch (error) {
    console.error("Reorder playlist error:", error);
    res.status(500).json({ error: "Failed to reorder playlist" });
  }
});

export default router;