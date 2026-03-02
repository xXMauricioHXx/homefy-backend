import { FirestoreClient } from "../../../core/infrastructure/firestore/FirestoreClient";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { GetUserByIdUseCase } from "../application/use-cases/GetUserByIdUseCase";
import { CreateUserUseCase } from "../application/use-cases/CreateUserUseCase";
import { UpdateUserUseCase } from "../application/use-cases/UpdateUserUseCase";

export class UsersContainer {
  constructor(readonly db: FirestoreClient) {}

  get userRepository(): UserRepository {
    return new UserRepository(this.db);
  }

  get getUserByIdUseCase(): GetUserByIdUseCase {
    return new GetUserByIdUseCase(this.userRepository);
  }

  get createUserUseCase(): CreateUserUseCase {
    return new CreateUserUseCase(this.userRepository);
  }

  get updateUserUseCase(): UpdateUserUseCase {
    return new UpdateUserUseCase(this.userRepository);
  }
}
