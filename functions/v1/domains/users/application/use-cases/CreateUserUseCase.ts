import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { User } from "../../domain/entities/User";
import { CreateUserDto } from "../dtos/UserDtos";
import { UserAlreadyExistException } from "../../domain/exceptions/UserAlreadyExist";

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(data: CreateUserDto): Promise<User> {
    console.log("[START] - Creating user with data: ", data);

    console.log("[INFO] - Checking if user exists with uid: ", data.id);
    const userExists = await this.userRepository.findById(data.id);
    if (userExists) {
      console.log("[WARN] - User already exists with uid: ", data.id);
      throw new UserAlreadyExistException();
    }

    console.log(
      "[INFO] - Checking if user exists with email or phone: ",
      data.email,
      data.phone,
    );
    const userExistsWithEmailOrPhone =
      await this.userRepository.hasWithEmailOrPhone(data.email, data.phone);
    if (userExistsWithEmailOrPhone) {
      console.log(
        "[WARN] - User already exists with email or phone: ",
        data.email,
        data.phone,
      );
      throw new UserAlreadyExistException();
    }

    console.log("[INFO] - Creating user with data: ", data);
    const user = User.create(
      data.id,
      data.email,
      data.phone,
      data.name,
      data.photoUrl,
    );

    console.log(`[INFO] - User created: ${user.id}`);
    await this.userRepository.save(user);
    console.log(`[END] User with ${user.id} created`);
    return user;
  }
}
