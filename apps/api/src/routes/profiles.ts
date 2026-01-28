import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import type { Address, Hex } from "viem";
import { getDb, schema, fallback, isUsingFallback } from "../db/client";

const profiles = new Hono();

/**
 * GET /profiles/:address
 * Get profile by wallet address
 */
profiles.get("/:address", async (c) => {
  const address = c.req.param("address");
  const normalizedAddress = address.toLowerCase();

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return c.json(
      {
        error: "Invalid Ethereum address format",
      },
      400,
    );
  }

  if (isUsingFallback()) {
    const profile = fallback.getProfileByAddress(normalizedAddress);

    if (!profile) {
      return c.json(
        {
          error: "Profile not found",
        },
        404,
      );
    }

    return c.json({
      address: profile.address,
      nickname: profile.nickname,
      avatar: profile.avatarStyle
        ? {
            style: profile.avatarStyle,
            seed: profile.avatarSeed,
            gender: profile.avatarGender,
          }
        : null,
      ens: profile.nickname ? `${profile.nickname}.villa.eth` : null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  }

  const db = getDb();
  const [profile] = await db
    .select({
      address: schema.profiles.address,
      nickname: schema.profiles.nickname,
      avatarStyle: schema.profiles.avatarStyle,
      avatarSeed: schema.profiles.avatarSeed,
      avatarGender: schema.profiles.avatarGender,
      createdAt: schema.profiles.createdAt,
      updatedAt: schema.profiles.updatedAt,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.address, normalizedAddress))
    .limit(1);

  if (!profile) {
    return c.json(
      {
        error: "Profile not found",
      },
      404,
    );
  }

  return c.json({
    address: profile.address,
    nickname: profile.nickname,
    avatar: profile.avatarStyle
      ? {
          style: profile.avatarStyle,
          seed: profile.avatarSeed,
          gender: profile.avatarGender,
        }
      : null,
    ens: profile.nickname ? `${profile.nickname}.villa.eth` : null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  });
});

/**
 * POST /profiles
 * Create or update a profile
 *
 * Body: {
 *   address: string,
 *   nickname?: string,
 *   avatar?: {
 *     style: string,
 *     seed?: string,
 *     gender?: string
 *   }
 * }
 */
profiles.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { address, nickname, avatar } = body;

    if (!address) {
      return c.json(
        {
          error: "Missing required field: address",
        },
        400,
      );
    }

    const normalizedAddress = address.toLowerCase();

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json(
        {
          error: "Invalid Ethereum address format",
        },
        400,
      );
    }

    if (isUsingFallback()) {
      let profile = fallback.getProfileByAddress(normalizedAddress);

      if (profile) {
        const updatedProfile: schema.Profile = {
          ...profile,
          nickname: nickname || profile.nickname,
          avatarStyle: avatar?.style || profile.avatarStyle,
          avatarSeed: avatar?.seed || profile.avatarSeed,
          avatarGender: avatar?.gender || profile.avatarGender,
          updatedAt: new Date(),
        };

        fallback.profiles.set(normalizedAddress, updatedProfile);

        if (
          updatedProfile.nickname &&
          updatedProfile.nickname !== profile.nickname
        ) {
          if (profile.nickname) {
            fallback.nicknames.delete(profile.nickname);
          }
          fallback.nicknames.set(updatedProfile.nickname, normalizedAddress);
        }

        return c.json({
          address: updatedProfile.address,
          nickname: updatedProfile.nickname,
          avatar: updatedProfile.avatarStyle
            ? {
                style: updatedProfile.avatarStyle,
                seed: updatedProfile.avatarSeed,
                gender: updatedProfile.avatarGender,
              }
            : null,
          ens: updatedProfile.nickname
            ? `${updatedProfile.nickname}.villa.eth`
            : null,
          createdAt: updatedProfile.createdAt,
          updatedAt: updatedProfile.updatedAt,
        });
      } else {
        const newProfile = fallback.createProfile({
          address: normalizedAddress,
          nickname,
          avatarStyle: avatar?.style || "bottts",
          avatarSeed: avatar?.seed,
          avatarGender: avatar?.gender,
        });

        return c.json({
          address: newProfile.address,
          nickname: newProfile.nickname,
          avatar: newProfile.avatarStyle
            ? {
                style: newProfile.avatarStyle,
                seed: newProfile.avatarSeed,
                gender: newProfile.avatarGender,
              }
            : null,
          ens: newProfile.nickname ? `${newProfile.nickname}.villa.eth` : null,
          createdAt: newProfile.createdAt,
          updatedAt: newProfile.updatedAt,
        });
      }
    }

    const db = getDb();

    let profile = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.address, normalizedAddress))
      .limit(1)
      .then((rows) => rows[0]);

    if (profile) {
      const [updatedProfile] = await db
        .update(schema.profiles)
        .set({
          nickname: nickname || profile.nickname,
          avatarStyle: avatar?.style || profile.avatarStyle,
          avatarSeed: avatar?.seed || profile.avatarSeed,
          avatarGender: avatar?.gender || profile.avatarGender,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.address, normalizedAddress))
        .returning();

      await db.insert(schema.auditLog).values({
        address: normalizedAddress,
        action: "profile_updated",
        details: {
          nickname: updatedProfile.nickname,
          avatar: {
            style: updatedProfile.avatarStyle,
            seed: updatedProfile.avatarSeed,
            gender: updatedProfile.avatarGender,
          },
        },
      });

      return c.json({
        address: updatedProfile.address,
        nickname: updatedProfile.nickname,
        avatar: updatedProfile.avatarStyle
          ? {
              style: updatedProfile.avatarStyle,
              seed: updatedProfile.avatarSeed,
              gender: updatedProfile.avatarGender,
            }
          : null,
        ens: updatedProfile.nickname
          ? `${updatedProfile.nickname}.villa.eth`
          : null,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt,
      });
    } else {
      const [newProfile] = await db
        .insert(schema.profiles)
        .values({
          address: normalizedAddress,
          nickname,
          avatarStyle: avatar?.style || "bottts",
          avatarSeed: avatar?.seed,
          avatarGender: avatar?.gender,
        })
        .returning();

      await db.insert(schema.auditLog).values({
        address: normalizedAddress,
        action: "profile_created",
        details: {
          nickname: newProfile.nickname,
          avatar: {
            style: newProfile.avatarStyle,
            seed: newProfile.avatarSeed,
            gender: newProfile.avatarGender,
          },
        },
      });

      return c.json({
        address: newProfile.address,
        nickname: newProfile.nickname,
        avatar: newProfile.avatarStyle
          ? {
              style: newProfile.avatarStyle,
              seed: newProfile.avatarSeed,
              gender: newProfile.avatarGender,
            }
          : null,
        ens: newProfile.nickname ? `${newProfile.nickname}.villa.eth` : null,
        createdAt: newProfile.createdAt,
        updatedAt: newProfile.updatedAt,
      });
    }
  } catch (error) {
    console.error("Profile creation/update error:", error);
    return c.json(
      {
        error: "Internal server error",
      },
      500,
    );
  }
});

/**
 * PUT /profiles/:address
 * Update specific profile by address
 */
profiles.put("/:address", async (c) => {
  try {
    const address = c.req.param("address");
    const normalizedAddress = address.toLowerCase();
    const body = await c.req.json();
    const { nickname, avatar } = body;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return c.json(
        {
          error: "Invalid Ethereum address format",
        },
        400,
      );
    }

    if (isUsingFallback()) {
      const profile = fallback.getProfileByAddress(normalizedAddress);

      if (!profile) {
        return c.json(
          {
            error: "Profile not found",
          },
          404,
        );
      }

      const updatedProfile: schema.Profile = {
        ...profile,
        nickname: nickname !== undefined ? nickname : profile.nickname,
        avatarStyle: avatar?.style || profile.avatarStyle,
        avatarSeed:
          avatar?.seed !== undefined ? avatar.seed : profile.avatarSeed,
        avatarGender:
          avatar?.gender !== undefined ? avatar.gender : profile.avatarGender,
        updatedAt: new Date(),
      };

      fallback.profiles.set(normalizedAddress, updatedProfile);

      if (
        updatedProfile.nickname &&
        updatedProfile.nickname !== profile.nickname
      ) {
        if (profile.nickname) {
          fallback.nicknames.delete(profile.nickname);
        }
        fallback.nicknames.set(updatedProfile.nickname, normalizedAddress);
      }

      return c.json({
        address: updatedProfile.address,
        nickname: updatedProfile.nickname,
        avatar: updatedProfile.avatarStyle
          ? {
              style: updatedProfile.avatarStyle,
              seed: updatedProfile.avatarSeed,
              gender: updatedProfile.avatarGender,
            }
          : null,
        ens: updatedProfile.nickname
          ? `${updatedProfile.nickname}.villa.eth`
          : null,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt,
      });
    }

    const db = getDb();

    const profile = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.address, normalizedAddress))
      .limit(1)
      .then((rows) => rows[0]);

    if (!profile) {
      return c.json(
        {
          error: "Profile not found",
        },
        404,
      );
    }

    const [updatedProfile] = await db
      .update(schema.profiles)
      .set({
        nickname: nickname !== undefined ? nickname : profile.nickname,
        avatarStyle: avatar?.style || profile.avatarStyle,
        avatarSeed:
          avatar?.seed !== undefined ? avatar.seed : profile.avatarSeed,
        avatarGender:
          avatar?.gender !== undefined ? avatar.gender : profile.avatarGender,
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.address, normalizedAddress))
      .returning();

    await db.insert(schema.auditLog).values({
      address: normalizedAddress,
      action: "profile_updated",
      details: {
        nickname: updatedProfile.nickname,
        avatar: {
          style: updatedProfile.avatarStyle,
          seed: updatedProfile.avatarSeed,
          gender: updatedProfile.avatarGender,
        },
      },
    });

    return c.json({
      address: updatedProfile.address,
      nickname: updatedProfile.nickname,
      avatar: updatedProfile.avatarStyle
        ? {
            style: updatedProfile.avatarStyle,
            seed: updatedProfile.avatarSeed,
            gender: updatedProfile.avatarGender,
          }
        : null,
      ens: updatedProfile.nickname
        ? `${updatedProfile.nickname}.villa.eth`
        : null,
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return c.json(
      {
        error: "Internal server error",
      },
      500,
    );
  }
});

export default profiles;
