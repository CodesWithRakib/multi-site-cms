import { DataSource } from 'typeorm';
import * as argon2 from '@node-rs/argon2';
import { buildDataSourceOptions } from '../database-options';
import { env } from '../../config/env';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Site } from '../entities/site.entity';
import { UserRoleAssignment } from '../entities/user-role-assignment.entity';

async function main() {
  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const siteRepo = dataSource.getRepository(Site);
  const assignmentRepo = dataSource.getRepository(UserRoleAssignment);

  const hashOpts = {
    algorithm: 2, // Argon2id
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  };

  const superAdminPass = await argon2.hash('SuperAdmin123!', hashOpts);
  const travelAdminPass = await argon2.hash('TravelAdmin123!', hashOpts);
  const airAdminPass = await argon2.hash('AirSportsAdmin123!', hashOpts);

  // 0. Super Admin Platform Alias
  let superUser = await userRepo.findOne({ where: { email: 'superadmin@platform.internal' } });
  if (!superUser) {
    superUser = userRepo.create({
      email: 'superadmin@platform.internal',
      displayName: 'Super Admin',
      passwordHash: superAdminPass,
      status: 'active',
    });
    await userRepo.save(superUser);
  } else {
    superUser.passwordHash = superAdminPass;
    superUser.status = 'active';
    await userRepo.save(superUser);
  }

  const superRole = await roleRepo.findOne({ where: { key: 'super_admin', scopeType: 'platform' } });
  if (superRole) {
    const existingSuperAssign = await assignmentRepo.findOne({
      where: { userId: superUser.id, roleId: superRole.id, scopeType: 'platform' },
    });
    if (!existingSuperAssign) {
      await assignmentRepo.save(
        assignmentRepo.create({
          userId: superUser.id,
          roleId: superRole.id,
          scopeType: 'platform',
          siteId: null,
        }),
      );
    }
  }

  // 1. Travel Blog Admin
  let travelUser = await userRepo.findOne({ where: { email: 'traveladmin@travelblog.internal' } });
  if (!travelUser) {
    travelUser = userRepo.create({
      email: 'traveladmin@travelblog.internal',
      displayName: 'Travel Blog Admin',
      passwordHash: travelAdminPass,
      status: 'active',
    });
    await userRepo.save(travelUser);
  } else {
    travelUser.passwordHash = travelAdminPass;
    travelUser.status = 'active';
    await userRepo.save(travelUser);
  }

  // 2. Air Sports Admin
  let airUser = await userRepo.findOne({ where: { email: 'airsportsadmin@airsports.internal' } });
  if (!airUser) {
    airUser = userRepo.create({
      email: 'airsportsadmin@airsports.internal',
      displayName: 'Air Sports Admin',
      passwordHash: airAdminPass,
      status: 'active',
    });
    await userRepo.save(airUser);
  } else {
    airUser.passwordHash = airAdminPass;
    airUser.status = 'active';
    await userRepo.save(airUser);
  }

  // Find Admin Role
  const adminRole = await roleRepo.findOne({ where: { key: 'admin', scopeType: 'site' } });
  if (!adminRole) {
    throw new Error('Admin role not found');
  }

  // Find Sites
  const travelSite = await siteRepo.findOne({ where: { key: 'travel-blog' } });
  const airSite = await siteRepo.findOne({ where: { key: 'air-sports' } });

  if (travelSite) {
    const existingTravelAssign = await assignmentRepo.findOne({
      where: { userId: travelUser.id, roleId: adminRole.id, siteId: travelSite.id },
    });
    if (!existingTravelAssign) {
      await assignmentRepo.save(
        assignmentRepo.create({
          userId: travelUser.id,
          roleId: adminRole.id,
          scopeType: 'site',
          siteId: travelSite.id,
        }),
      );
    }
  }

  if (airSite) {
    const existingAirAssign = await assignmentRepo.findOne({
      where: { userId: airUser.id, roleId: adminRole.id, siteId: airSite.id },
    });
    if (!existingAirAssign) {
      await assignmentRepo.save(
        assignmentRepo.create({
          userId: airUser.id,
          roleId: adminRole.id,
          scopeType: 'site',
          siteId: airSite.id,
        }),
      );
    }
  }

  console.log('Site admins successfully provisioned.');
  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
