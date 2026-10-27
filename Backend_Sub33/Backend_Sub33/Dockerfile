# ── Backend (.NET 8) ────────────────────────────────────────────────
# Etapa 1: compilar y publicar
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Backend_Sub33.csproj", "."]
RUN dotnet restore "Backend_Sub33.csproj"

COPY . .
RUN dotnet publish "Backend_Sub33.csproj" -c Release -o /app/publish /p:UseAppHost=false /p:TreatWarningsAsErrors=false /p:AnalysisLevel=none

# Etapa 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5196
ENTRYPOINT ["dotnet", "Backend_Sub33.dll"]
